-- Two fixes surfaced while building the admin Payouts section:
--
-- 1. payout_batches / payout_batch_items had SELECT-only RLS (00002).
--    That's correct for the automated Friday cron (pg_cron runs with
--    elevated privileges that bypass RLS entirely), but it silently
--    blocks an admin from manually triggering batch generation or
--    marking a batch 'paid' after sending a real transfer — both of
--    which the admin dashboard needs to do through the normal
--    anon-key session, which IS subject to RLS.
--
-- 2. generate_weekly_payout_batches() (00016) was a plain function,
--    not SECURITY DEFINER, so even with an admin-only RLS policy
--    added below, calling it via RPC as an admin would still fail —
--    the INSERTs inside it run as the calling role. Making it
--    SECURITY DEFINER matches the convention already used elsewhere
--    in this codebase (is_admin(), maybe_upgrade_scout_trust_tier,
--    protect_admin_only_scout_columns) and lets an admin manually
--    catch up a missed cycle without needing service-role access.

create policy "payout_batches_admin_update" on payout_batches
  for update using (is_admin());

alter function generate_weekly_payout_batches() security definer;
