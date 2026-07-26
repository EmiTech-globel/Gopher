-- Enables scheduled SQL jobs (pg_cron) and outbound HTTP calls from
-- Postgres (pg_net, used later for the payout batch job if it ever needs
-- to call an Edge Function instead of pure SQL).
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Add a status for requests the requester never responded to in time.
alter type balance_request_status add value if not exists 'expired';

-- Notification type for this event, separate from chat messages.
alter type notification_type add value if not exists 'balance_request_expired';

create or replace function expire_stale_balance_requests()
returns void as $$
begin
  update balance_requests
  set status = 'expired'
  where status = 'pending'
    and created_at < now() - interval '15 minutes';
end;
$$ language plpgsql;

-- Notifies the scout the moment their request actually expires, so they
-- know they're now free to cancel without penalty (Section 6).
create or replace function notify_on_balance_request_expired()
returns trigger as $$
declare
  scout_id_var uuid;
begin
  if new.status = 'expired' and old.status = 'pending' then
    select errands.scout_id into scout_id_var from errands where errands.id = new.errand_id;
    if scout_id_var is not null then
      insert into notifications (user_id, type, title, body, errand_id)
      values (
        scout_id_var,
        'balance_request_expired',
        'Funds request expired',
        'The requester did not respond in time. You can cancel this errand without penalty.',
        new.errand_id
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_on_balance_request_expired
  after update on balance_requests
  for each row
  execute function notify_on_balance_request_expired();

-- Runs every 5 minutes — frequent enough that the 10-15 minute window
-- from the spec is respected without being wasteful.
select cron.schedule(
  'expire-balance-requests',
  '*/5 * * * *',
  $$select expire_stale_balance_requests()$$
);