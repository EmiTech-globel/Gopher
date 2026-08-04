-- Errand state machine enforcement (flagged in 00004_state_machine_triggers.sql
-- and the README as pending). RLS (00002) governs WHO can touch a row, but
-- not whether a status transition is valid — this trigger closes that gap
-- so an app bug or a bypassed client can't push an errand through an
-- impossible transition (e.g. 'open' straight to 'confirmed').
--
-- Allowed transitions, matching the lifecycle in spec Section 2 plus the
-- real paths already exercised by the client:
--   open       -> accepted, cancelled
--   accepted   -> purchased, open (scout backs out before buying —
--                 see (scout)/errand/[id].tsx handleCancelWithoutPenalty),
--                 cancelled, disputed
--   purchased  -> delivered, disputed
--   delivered  -> confirmed, disputed
--   disputed   -> confirmed, cancelled (admin resolution: release_to_scout
--                 or refund_to_requester — see Section 10)
--   confirmed, cancelled -> terminal, no further transitions
--
-- Updates that don't change status (e.g. setting requester_phone_revealed)
-- are always allowed regardless of current status.

create or replace function enforce_errand_status_transition()
returns trigger as $$
declare
  is_valid boolean := false;
begin
  if new.status = old.status then
    return new;
  end if;

  is_valid := case old.status
    when 'open' then new.status in ('accepted', 'cancelled')
    when 'accepted' then new.status in ('purchased', 'open', 'cancelled', 'disputed')
    when 'purchased' then new.status in ('delivered', 'disputed')
    when 'delivered' then new.status in ('confirmed', 'disputed')
    when 'disputed' then new.status in ('confirmed', 'cancelled')
    else false
  end;

  if not is_valid then
    raise exception 'Invalid errand status transition: % -> %', old.status, new.status;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_enforce_errand_status_transition
  before update on errands
  for each row
  execute function enforce_errand_status_transition();
