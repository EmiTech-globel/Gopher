-- ============================================================================
-- 00024_notifications_and_push.sql
-- ============================================================================
-- Brings the notifications table into version control, adds RLS policies,
-- creates a push_tokens table, wires the missing chat→notification trigger,
-- adds notification triggers for all errand lifecycle events, and sets up
-- fire-and-forget push delivery via pg_net → Expo Push API.
-- ============================================================================

-- Ensure pg_net is available (idempotent — may already exist from 00015)
create extension if not exists pg_net;

-- ---------------------------------------------------------------------------
-- 1a. Notifications table (idempotent — may already exist in the live DB)
-- ---------------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type notification_type not null default 'chat_message',
  title text not null,
  body text,
  errand_id uuid references errands(id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index for the unread-count query that runs on every tab render
create index if not exists idx_notifications_user_unread
  on notifications (user_id) where (not read);

-- ---------------------------------------------------------------------------
-- 1b. RLS policies for notifications
-- ---------------------------------------------------------------------------
alter table notifications enable row level security;

create policy "notifications_user_read"
  on notifications for select
  using (user_id = auth.uid());

create policy "notifications_user_update"
  on notifications for update
  using (user_id = auth.uid());

-- Service-role inserts (from triggers / edge functions) bypass RLS
-- automatically, but we add an explicit INSERT policy so anon-role
-- callers (e.g. supabase-js with anon key) cannot inject rows.
create policy "notifications_service_insert"
  on notifications for insert
  with check (false);

-- ---------------------------------------------------------------------------
-- 1c. Push tokens table
-- ---------------------------------------------------------------------------
create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null,          -- 'ios' | 'android'
  created_at timestamptz not null default now(),
  constraint push_tokens_user_token_unique unique (user_id, token)
);

alter table push_tokens enable row level security;

create policy "push_tokens_user_read"
  on push_tokens for select
  using (user_id = auth.uid());

create policy "push_tokens_user_insert"
  on push_tokens for insert
  with check (user_id = auth.uid());

create policy "push_tokens_user_delete"
  on push_tokens for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 1d. Wire the missing chat → notification trigger
--     (function already exists in 00013, but the CREATE TRIGGER was
--      never committed)
-- ---------------------------------------------------------------------------
drop trigger if exists trg_notify_on_chat_message on chat_messages;

create trigger trg_notify_on_chat_message
  after insert on chat_messages
  for each row
  execute function notify_on_chat_message();

-- ---------------------------------------------------------------------------
-- 1e. Expand notification_type enum with new lifecycle events
-- ---------------------------------------------------------------------------
alter type notification_type add value if not exists 'errand_accepted';
alter type notification_type add value if not exists 'errand_delivered';
alter type notification_type add value if not exists 'errand_confirmed';
alter type notification_type add value if not exists 'errand_cancelled';
alter type notification_type add value if not exists 'balance_request_created';
alter type notification_type add value if not exists 'balance_request_approved';
alter type notification_type add value if not exists 'proof_submitted';

-- ---------------------------------------------------------------------------
-- 1e (cont). Notification trigger functions
--     All SECURITY DEFINER, all wrapped in exception handlers so a
--     notification failure never blocks the primary operation.
-- ---------------------------------------------------------------------------

-- Errand accepted → notify requester
create or replace function notify_on_errand_accepted()
returns trigger as $$
declare
  requester_name text;
begin
  begin
    select full_name into requester_name from profiles where id = new.requester_id;
    insert into notifications (user_id, type, title, body, errand_id)
    values (
      new.requester_id,
      'errand_accepted',
      'Errand accepted',
      coalesce(requester_name, 'A scout') || ' has accepted your errand.',
      new.id
    );
  exception when others then
    raise warning 'notify_on_errand_accepted failed: %', SQLERRM;
  end;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_on_errand_accepted
  after update on errands
  for each row
  when (old.status = 'open' and new.status = 'accepted')
  execute function notify_on_errand_accepted();

-- Errand delivered → notify requester
create or replace function notify_on_errand_delivered()
returns trigger as $$
declare
  scout_name text;
begin
  begin
    select full_name into scout_name from profiles where id = new.scout_id;
    insert into notifications (user_id, type, title, body, errand_id)
    values (
      new.requester_id,
      'errand_delivered',
      'Errand delivered',
      coalesce(scout_name, 'Your scout') || ' has delivered your errand. Please confirm.',
      new.id
    );
  exception when others then
    raise warning 'notify_on_errand_delivered failed: %', SQLERRM;
  end;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_on_errand_delivered
  after update on errands
  for each row
  when (old.status = 'purchased' and new.status = 'delivered')
  execute function notify_on_errand_delivered();

-- Errand confirmed → notify scout
create or replace function notify_on_errand_confirmed()
returns trigger as $$
declare
  requester_name text;
begin
  begin
    select full_name into requester_name from profiles where id = new.requester_id;
    insert into notifications (user_id, type, title, body, errand_id)
    values (
      new.scout_id,
      'errand_confirmed',
      'Delivery confirmed',
      coalesce(requester_name, 'The requester') || ' confirmed delivery. Earnings updated.',
      new.id
    );
  exception when others then
    raise warning 'notify_on_errand_confirmed failed: %', SQLERRM;
  end;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_on_errand_confirmed
  after update on errands
  for each row
  when (old.status = 'delivered' and new.status = 'confirmed')
  execute function notify_on_errand_confirmed();

-- Errand cancelled → notify the other party
create or replace function notify_on_errand_cancelled()
returns trigger as $$
declare
  notify_user_id uuid;
  notifier_name text;
begin
  begin
    -- Notify the scout if the requester cancelled, or the requester if the scout cancelled
    notify_user_id := case
      when old.requester_id = new.requester_id then new.scout_id
      else new.requester_id
    end;

    if notify_user_id is not null then
      select full_name into notifier_name from profiles where id = coalesce(new.scout_id, new.requester_id);
      insert into notifications (user_id, type, title, body, errand_id)
      values (
        notify_user_id,
        'errand_cancelled',
        'Errand cancelled',
        'An errand has been cancelled.',
        new.id
      );
    end if;
  exception when others then
    raise warning 'notify_on_errand_cancelled failed: %', SQLERRM;
  end;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_on_errand_cancelled
  after update on errands
  for each row
  when (old.status <> 'cancelled' and new.status = 'cancelled')
  execute function notify_on_errand_cancelled();

-- Balance request created → notify requester
create or replace function notify_on_balance_request_created()
returns trigger as $$
declare
  requester_id uuid;
begin
  begin
    select errands.requester_id into requester_id
    from errands where errands.id = new.errand_id;
    if requester_id is not null then
      insert into notifications (user_id, type, title, body, errand_id)
      values (
        requester_id,
        'balance_request_created',
        'Additional funds requested',
        'Your scout is requesting ₦' || to_char(new.requested_amount, 'FM999,999') || ' more for this errand.',
        new.errand_id
      );
    end if;
  exception when others then
    raise warning 'notify_on_balance_request_created failed: %', SQLERRM;
  end;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_on_balance_request_created
  after insert on balance_requests
  for each row
  execute function notify_on_balance_request_created();

-- Balance request approved → notify scout
create or replace function notify_on_balance_request_approved()
returns trigger as $$
begin
  begin
    if new.status = 'approved' and old.status = 'pending' then
      insert into notifications (user_id, type, title, body, errand_id)
      values (
        (select errands.scout_id from errands where errands.id = new.errand_id),
        'balance_request_approved',
        'Funds request approved',
        'The requester approved your additional funds request. You can now proceed.',
        new.errand_id
      );
    end if;
  exception when others then
    raise warning 'notify_on_balance_request_approved failed: %', SQLERRM;
  end;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_on_balance_request_approved
  after update on balance_requests
  for each row
  execute function notify_on_balance_request_approved();

-- Proof of purchase submitted (new-tier scout) → notify requester
create or replace function notify_on_proof_submitted()
returns trigger as $$
declare
  scout_name text;
begin
  begin
    if new.status = 'purchased' and old.status <> 'purchased' then
      -- Only notify for new-tier scouts (proof was required)
      select full_name into scout_name from profiles where id = new.scout_id;
      insert into notifications (user_id, type, title, body, errand_id)
      values (
        new.requester_id,
        'proof_submitted',
        'Proof of purchase submitted',
        coalesce(scout_name, 'Your scout') || ' has submitted proof of purchase.',
        new.id
      );
    end if;
  exception when others then
    raise warning 'notify_on_proof_submitted failed: %', SQLERRM;
  end;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_on_proof_submitted
  after update on errands
  for each row
  execute function notify_on_proof_submitted();

-- ---------------------------------------------------------------------------
-- 1f. Fire-and-forget push delivery via pg_net
--     When a notification row is inserted, this trigger posts to the
--     Expo Push API for each of the recipient's registered push tokens.
--     Uses pg_net.http_post() which returns immediately — the trigger
--     does NOT wait for the HTTP response.
-- ---------------------------------------------------------------------------
create or replace function send_push_for_notification()
returns trigger as $$
declare
  token_rec record;
  base_payload jsonb;
  send_payload jsonb;
begin
  -- Build the base Expo Push payload (token filled per iteration below)
  base_payload := jsonb_build_object(
    'to', '',
    'title', new.title,
    'body', coalesce(new.body, ''),
    'data', jsonb_build_object(
      'notificationId', new.id,
      'type', new.type,
      'errandId', new.errand_id
    ),
    'sound', 'default'
  );

  -- Send to each of the recipient's registered push tokens
  for token_rec in
    select token from push_tokens where user_id = new.user_id
  loop
    send_payload := jsonb_set(base_payload, '{to}', to_jsonb(token_rec.token));
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Accept', 'application/json'
      ),
      body := send_payload::text
    );
  end loop;

  return new;
exception when others then
  -- Push delivery is secondary; a failure here must never roll back
  -- the notification insert.
  raise warning 'send_push_for_notification failed: %', SQLERRM;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_send_push_on_notification
  after insert on notifications
  for each row
  execute function send_push_for_notification();
