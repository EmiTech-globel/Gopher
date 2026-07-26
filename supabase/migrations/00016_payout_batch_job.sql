-- Generates one payout_batches row per scout per week, covering all
-- confirmed errands not yet included in any batch. Per Section 8's
-- one-week rolling delay: this runs every Friday, covering the most
-- recently completed Mon-Sun week, with payout_date set to the
-- following Saturday. NOTE: the exact day-offset math below is a
-- reasonable first pass — verify against a real calendar once this has
-- run for a couple of cycles before relying on it for real payouts.
create or replace function generate_weekly_payout_batches()
returns void as $$
declare
  target_week_start date;
  target_week_end date;
  target_payout_date date;
  scout_record record;
  batch_id_var uuid;
  batch_total numeric(10, 2);
begin
  -- The week that just completed, ending last Sunday.
  target_week_end := (current_date - extract(dow from current_date)::int * interval '1 day')::date - 1;
  target_week_start := target_week_end - 6;
  target_payout_date := current_date + 1; -- tomorrow, i.e. Saturday

  for scout_record in
    select distinct e.scout_id
    from errands e
    where e.status = 'confirmed'
      and e.scout_id is not null
      and e.confirmed_at::date between target_week_start and target_week_end
      and not exists (
        select 1 from payout_batch_items pbi where pbi.errand_id = e.id
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
      round(e.delivery_fee * 0.82, 2)
    from errands e
    where e.status = 'confirmed'
      and e.scout_id = scout_record.scout_id
      and e.confirmed_at::date between target_week_start and target_week_end
      and not exists (select 1 from payout_batch_items pbi where pbi.errand_id = e.id);

    select coalesce(sum(amount), 0) into batch_total
    from payout_batch_items where batch_id = batch_id_var;

    update payout_batches set total_amount = batch_total where id = batch_id_var;
  end loop;
end;
$$ language plpgsql;

-- Every Friday at 09:00 UTC — adjust the hour to whatever your actual
-- timezone/operational preference is; cron time here is UTC regardless
-- of server locale.
select cron.schedule(
  'generate-weekly-payout-batches',
  '0 9 * * 5',
  $$select generate_weekly_payout_batches()$$
);