-- Spec Section 13 promises Settings as "adjustable parameters without
-- touching code," but every one of these four values was hardcoded
-- as a literal scattered across the mobile app and DB trigger
-- functions. A settings page that saves values nothing actually reads
-- would be cosmetic, not functional — this migration makes the
-- values real, and the functions/screens below are updated in the
-- same patch to read from here instead of a hardcoded constant.
--
-- Singleton table (always exactly one row, id fixed at 1) rather than
-- a generic key-value store — four typed columns are simpler to read
-- and validate than parsing a generic settings blob, and there's no
-- realistic need for more than one settings profile.

create table platform_settings (
  id int primary key default 1,
  charges_fee_percent numeric(4, 2) not null default 18.00,
  new_scout_value_cap numeric(10, 2) not null default 2000.00,
  trust_tier_threshold int not null default 3,
  resubmission_limit int not null default 3,
  updated_at timestamptz not null default now(),
  constraint platform_settings_singleton check (id = 1)
);

insert into platform_settings (id) values (1);

alter table platform_settings enable row level security;

-- Read: any authenticated user — the mobile app needs
-- new_scout_value_cap (browse.tsx's locking display) and
-- resubmission_limit (verification-rejected.tsx's attempts-remaining
-- counter) client-side, not just the admin dashboard.
create policy "platform_settings_read" on platform_settings
  for select using (auth.role() = 'authenticated');

create policy "platform_settings_admin_write" on platform_settings
  for update using (is_admin());

-- Trust-tier auto-upgrade (00027) now reads the threshold instead of
-- a hardcoded literal 3.
create or replace function maybe_upgrade_scout_trust_tier()
returns trigger as $$
declare
  scout_row scouts%rowtype;
  has_unresolved_dispute boolean;
  threshold int;
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' and new.scout_id is not null then
    select * into scout_row from scouts where profile_id = new.scout_id;
    select trust_tier_threshold into threshold from platform_settings where id = 1;

    if scout_row.trust_tier = 'new' and scout_row.completed_errands_count >= threshold then
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
  raise warning 'maybe_upgrade_scout_trust_tier failed: %', SQLERRM;
  return new;
end;
$$ language plpgsql security definer;

-- Weekly payout batch generator (00016) now reads the Charges Fee
-- percentage instead of the hardcoded 0.82 scout-share literal.
create or replace function generate_weekly_payout_batches()
returns void as $$
declare
  target_week_start date;
  target_week_end date;
  target_payout_date date;
  scout_record record;
  batch_id_var uuid;
  batch_total numeric(10, 2);
  scout_share numeric(5, 4);
begin
  select (1 - charges_fee_percent / 100.0) into scout_share from platform_settings where id = 1;

  target_week_end := (current_date - extract(dow from current_date)::int * interval '1 day')::date - 1;
  target_week_start := target_week_end - 6;
  target_payout_date := current_date + 1;

  for scout_record in
    select distinct e.scout_id
    from errands e
    where e.status = 'confirmed'
      and e.scout_id is not null
      and e.confirmed_at::date between target_week_start and target_week_end
      and not exists (
        select 1 from payout_batch_items pbi where pbi.errand_id = e.id
      )
      and not exists (
        select 1 from disputes d
        where d.errand_id = e.id and d.resolution = 'partial_split'
      )
  loop
    batch_total := 0;

    insert into payout_batches (scout_id, week_start, week_end, payout_date, total_amount, status)
    values (scout_record.scout_id, target_week_start, target_week_end, target_payout_date, 0, 'pending')
    returning id into batch_id_var;

    insert into payout_batch_items (batch_id, errand_id, amount)
    select
      batch_id_var,
      e.id,
      round(e.delivery_fee * scout_share, 2)
    from errands e
    where e.status = 'confirmed'
      and e.scout_id = scout_record.scout_id
      and e.confirmed_at::date between target_week_start and target_week_end
      and not exists (select 1 from payout_batch_items pbi where pbi.errand_id = e.id)
      and not exists (
        select 1 from disputes d
        where d.errand_id = e.id and d.resolution = 'partial_split'
      );

    select coalesce(sum(amount), 0) into batch_total
    from payout_batch_items where batch_id = batch_id_var;

    update payout_batches set total_amount = batch_total where id = batch_id_var;
  end loop;
end;
$$ language plpgsql security definer;
