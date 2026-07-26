-- Keeps scouts.completed_errands_count and scouts.rating_avg accurate
-- automatically, rather than relying on the client to compute and write
-- these — matches the existing pattern of trusting the database as the
-- source of truth for anything that affects trust-tier eligibility
-- (Section 5: 3 completed errands unlocks trusted tier).

create or replace function increment_completed_errands()
returns trigger as $$
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' and new.scout_id is not null then
    update scouts
    set completed_errands_count = completed_errands_count + 1
    where profile_id = new.scout_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_increment_completed_errands
  after update on errands
  for each row
  execute function increment_completed_errands();

create or replace function recalculate_scout_rating()
returns trigger as $$
begin
  update scouts
  set rating_avg = (
    select round(avg(stars)::numeric, 1)
    from ratings
    where rated_user_id = new.rated_user_id
  )
  where profile_id = new.rated_user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_recalculate_scout_rating
  after insert on ratings
  for each row
  execute function recalculate_scout_rating();