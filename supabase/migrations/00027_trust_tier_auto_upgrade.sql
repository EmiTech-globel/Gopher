-- Trust-tier auto-upgrade (spec Section 5): a scout unlocks Trusted status
-- after 3 completed errands with no unresolved disputes. Runs as a second
-- AFTER UPDATE trigger on the same 'confirmed' transition that
-- increment_completed_errands (00019) already handles — trigger name
-- ordering ("trg_increment..." before "trg_maybe_upgrade...") means the
-- count this reads has already been bumped by the time this fires.

create or replace function maybe_upgrade_scout_trust_tier()
returns trigger as $$
declare
  scout_row scouts%rowtype;
  has_unresolved_dispute boolean;
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' and new.scout_id is not null then
    select * into scout_row from scouts where profile_id = new.scout_id;

    if scout_row.trust_tier = 'new' and scout_row.completed_errands_count >= 3 then
      select exists (
        select 1
        from disputes d
        join errands e on e.id = d.errand_id
        where e.scout_id = new.scout_id
        and d.status = 'open'
      ) into has_unresolved_dispute;

      if not has_unresolved_dispute then
        update scouts set trust_tier = 'trusted' where profile_id = new.scout_id;
      end if;
    end if;
  end if;

  return new;
exception when others then
  -- Never let a trust-tier upgrade failure block the confirmation itself.
  raise warning 'maybe_upgrade_scout_trust_tier failed: %', SQLERRM;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_maybe_upgrade_scout_trust_tier
  after update on errands
  for each row
  execute function maybe_upgrade_scout_trust_tier();
