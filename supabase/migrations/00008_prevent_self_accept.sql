-- Prevents a user from accepting their own posted errand as a scout.
-- Enforced at the trigger level (not just client filtering or RLS) so it
-- holds even for service-role writes and can't be bypassed by calling
-- the update directly instead of going through the Browse screen's UI.
create or replace function prevent_self_accept()
returns trigger as $$
begin
  if new.scout_id is not null and new.scout_id = new.requester_id then
    raise exception 'A user cannot accept their own errand as a scout.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_prevent_self_accept
  before insert or update on errands
  for each row
  execute function prevent_self_accept();