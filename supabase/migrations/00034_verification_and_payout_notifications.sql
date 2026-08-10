-- Two confirmed gaps: scouts were never notified (in-app or push)
-- when their verification was approved/rejected, nor when a payout
-- batch was actually paid. Both reuse the exact trigger + notification
-- pattern already established in 00024 — inserting into notifications
-- automatically fires a push via trg_send_push_on_notification,
-- no changes needed there.

alter type notification_type add value if not exists 'verification_approved';
alter type notification_type add value if not exists 'verification_rejected';
alter type notification_type add value if not exists 'payout_sent';

create or replace function notify_on_verification_status_change()
returns trigger as $$
begin
  if old.verification_status = 'pending' and new.verification_status = 'approved' then
    insert into notifications (user_id, type, title, body)
    values (
      new.profile_id,
      'verification_approved',
      'You''re verified!',
      'Your scout application was approved. You can start browsing and accepting errands now.'
    );
  elsif old.verification_status = 'pending' and new.verification_status = 'rejected' then
    insert into notifications (user_id, type, title, body)
    values (
      new.profile_id,
      'verification_rejected',
      'Verification not approved',
      coalesce(new.rejection_reason, 'Your selfie or student ID did not meet our requirements. Check the app for details on resubmitting.')
    );
  end if;
  return new;
exception when others then
  raise warning 'notify_on_verification_status_change failed: %', SQLERRM;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_on_verification_status_change
  after update on scouts
  for each row
  execute function notify_on_verification_status_change();

create or replace function notify_on_payout_paid()
returns trigger as $$
begin
  if old.status = 'pending' and new.status = 'paid' then
    insert into notifications (user_id, type, title, body)
    values (
      new.scout_id,
      'payout_sent',
      'Payout sent',
      'Your Commission of ₦' || to_char(new.total_amount, 'FM999,999,999.00') || ' for ' ||
        to_char(new.week_start, 'Mon DD') || ' – ' || to_char(new.week_end, 'Mon DD') ||
        ' has been sent to your bank account.'
    );
  end if;
  return new;
exception when others then
  raise warning 'notify_on_payout_paid failed: %', SQLERRM;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_on_payout_paid
  after update on payout_batches
  for each row
  execute function notify_on_payout_paid();