-- Cap active errands per scout at 2. Mirrors the DB-level enforcement style
-- of 00026 (state machine) and 00027 (trust tier): an app bug or a bypassed
-- client can't talk its way past this, and the accept handlers in
-- (scout)/(tabs)/browse.tsx and (scout)/errand/[id].tsx already surface the
-- raised exception through the toast system.
--
-- "Active" matches the home screen's ACTIVE_STATUSES list:
-- accepted, purchased, delivered, disputed. An 'open' errand isn't assigned
-- yet, and 'confirmed'/'cancelled' are terminal, so neither counts.
--
-- The trigger fires BEFORE the accepting UPDATE applies, so the row being
-- accepted is still 'open' in the table and won't count against the scout
-- — the check is purely "how many is this scout already juggling?".

create or replace function enforce_scout_max_active_errands()
returns trigger as $$
declare
  active_count integer;
begin
  -- Only the open -> accepted transition (with a scout being assigned) can
  -- grow a scout's active load, so that's the only case worth gating.
  if old.status = 'open' and new.status = 'accepted' and new.scout_id is not null then
    select count(*) into active_count
    from errands
    where scout_id = new.scout_id
      and status in ('accepted', 'purchased', 'delivered', 'disputed');

    if active_count >= 2 then
      raise exception 'You already have 2 active errands. Finish one before accepting another.';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_enforce_scout_max_active_errands
  before update on errands
  for each row
  execute function enforce_scout_max_active_errands();
