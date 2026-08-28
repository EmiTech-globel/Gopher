-- ============================================================================
-- 00038_notify_admin_on_scout_submission.sql
-- ============================================================================
-- When a scout creates their scouts row (verification_status = 'pending'),
-- insert a notification row for every admin user so the admin dashboard's
-- Realtime subscription picks it up and their notification list is updated.
--
-- Admin users are identified by raw_app_meta_data->>'role' = 'admin'
-- (set via Supabase Dashboard or the service-role API when creating admin
-- accounts). The in-app notification is the primary signal; the admin web
-- app's VerificationRealtimeWatcher client component also subscribes to
-- the scouts INSERT directly via Realtime and calls router.refresh() +
-- fires a browser notification independently of this table.
-- ============================================================================

alter type notification_type add value if not exists 'scout_submitted';

create or replace function notify_admin_on_scout_submission()
returns trigger as $$
declare
  admin_rec record;
begin
  -- Only fire on fresh pending submissions
  if new.verification_status <> 'pending' then
    return new;
  end if;

  -- Insert a notification for every admin user
  for admin_rec in
    select id from auth.users
    where raw_app_meta_data->>'role' = 'admin'
  loop
    begin
      insert into notifications (user_id, type, title, body)
      values (
        admin_rec.id,
        'scout_submitted',
        'New scout application',
        'A new scout has submitted their ID and selfie for verification.'
      );
    exception when others then
      raise warning 'notify_admin_on_scout_submission: failed for admin %: %', admin_rec.id, SQLERRM;
    end;
  end loop;

  return new;
exception when others then
  raise warning 'notify_admin_on_scout_submission outer: %', SQLERRM;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_admin_on_scout_submission
  after insert on scouts
  for each row
  execute function notify_admin_on_scout_submission();
