-- Per errand, not global: each party can reveal their own number to the
-- other once chat has started (Section 12). profiles.reveal_phone_by_default
-- (00021) sets the *default*, but the actual visible/hidden state lives
-- per-errand here, since someone might reveal manually on one errand
-- without having the global default on.
alter table errands
  add column requester_phone_revealed boolean not null default false,
  add column scout_phone_revealed boolean not null default false;

-- Returns the counterpart's phone ONLY if: caller is a party on this
-- errand, AND the counterpart has actually revealed. This is the only
-- path to read another person's phone number anywhere in the app —
-- public_profiles deliberately excludes it (Section 20), so this
-- function is the sole, audited exception, gated on the reveal flag.
create or replace function get_counterpart_phone(target_errand_id uuid)
returns text as $$
declare
  errand_row errands%rowtype;
  counterpart_id uuid;
  counterpart_revealed boolean;
begin
  select * into errand_row from errands where id = target_errand_id;
  if errand_row.id is null then
    return null;
  end if;

  if auth.uid() = errand_row.requester_id then
    counterpart_id := errand_row.scout_id;
    counterpart_revealed := errand_row.scout_phone_revealed;
  elsif auth.uid() = errand_row.scout_id then
    counterpart_id := errand_row.requester_id;
    counterpart_revealed := errand_row.requester_phone_revealed;
  else
    return null;
  end if;

  if counterpart_id is null or not counterpart_revealed then
    return null;
  end if;

  return (select phone from profiles where id = counterpart_id);
end;
$$ language plpgsql security definer;

-- Reveals the caller's OWN number for this errand. Idempotent — safe to
-- call repeatedly (e.g. auto-triggered by the reveal_phone_by_default
-- preference every time chat opens).
create or replace function reveal_my_phone(target_errand_id uuid)
returns void as $$
declare
  errand_row errands%rowtype;
begin
  select * into errand_row from errands where id = target_errand_id;
  if errand_row.id is null then
    raise exception 'Errand not found';
  end if;

  if auth.uid() = errand_row.requester_id then
    update errands set requester_phone_revealed = true where id = target_errand_id;
  elsif auth.uid() = errand_row.scout_id then
    update errands set scout_phone_revealed = true where id = target_errand_id;
  else
    raise exception 'Not authorized on this errand';
  end if;
end;
$$ language plpgsql security definer;