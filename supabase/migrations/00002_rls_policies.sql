-- Row Level Security per Section 20 of gopher-project-spec.docx.
-- Admin bypass pattern matches Betaliving: an `admins` table checked via
-- EXISTS subquery, granting full read/write across every table below.

create or replace function is_admin() returns boolean as $$
  select exists (select 1 from admins where id = auth.uid());
$$ language sql security definer stable;

alter table profiles enable row level security;
alter table scouts enable row level security;
alter table errands enable row level security;
alter table admins enable row level security;
alter table transactions enable row level security;
alter table balance_requests enable row level security;
alter table disputes enable row level security;
alter table chat_messages enable row level security;
alter table ratings enable row level security;
alter table payout_batches enable row level security;
alter table payout_batch_items enable row level security;


-- admins: readable only by admins themselves. No insert/update/delete
-- policy for any client role — admin rows are managed manually via the
-- Supabase dashboard/SQL editor only, never the app.
create policy "admins_read" on admins for select using (is_admin());

-- profiles: own row full access; admin full access.
-- The "restricted view exposing only name/avatar/department" mentioned in
-- Section 20 is a separate `public_profiles` view, not a table policy —
-- see 00003_public_views.sql.
create policy "profiles_own_read" on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles_own_write" on profiles for update using (id = auth.uid() or is_admin());
create policy "profiles_own_insert" on profiles for insert with check (id = auth.uid());

-- scouts: own row full access; verification_status/trust_tier/banned_at
-- are admin-only writes, enforced via a trigger (00004) since column-level
-- RLS on UPDATE isn't expressive enough to allow partial self-updates.
create policy "scouts_own_read" on scouts for select using (profile_id = auth.uid() or is_admin());
create policy "scouts_own_insert" on scouts for insert with check (profile_id = auth.uid());
create policy "scouts_own_update" on scouts for update using (profile_id = auth.uid() or is_admin());

-- errands: requester inserts/sees own; any verified scout sees open
-- errands (value-cap filtering happens in the query layer, not here —
-- see getOpenErrands in packages/supabase-client); updates restricted to
-- the two assigned parties.
create policy "errands_requester_insert" on errands for insert with check (requester_id = auth.uid());
create policy "errands_read" on errands for select using (
  requester_id = auth.uid()
  or scout_id = auth.uid()
  or status = 'open'
  or is_admin()
);
create policy "errands_update" on errands for update using (
  requester_id = auth.uid() or scout_id = auth.uid() or is_admin()
);

-- transactions: the escrow ledger. No client — not even the owner — can
-- write directly. Only the service role (Edge Functions, after a verified
-- Paystack webhook) writes here.
create policy "transactions_read" on transactions for select using (
  exists (
    select 1 from errands
    where errands.id = transactions.errand_id
    and (errands.requester_id = auth.uid() or errands.scout_id = auth.uid())
  ) or is_admin()
);

-- balance_requests: scout inserts, requester approves/declines, both read.
create policy "balance_requests_scout_insert" on balance_requests for insert with check (
  exists (select 1 from errands where errands.id = errand_id and errands.scout_id = auth.uid())
);
create policy "balance_requests_read" on balance_requests for select using (
  exists (
    select 1 from errands
    where errands.id = errand_id
    and (errands.requester_id = auth.uid() or errands.scout_id = auth.uid())
  ) or is_admin()
);
create policy "balance_requests_requester_update" on balance_requests for update using (
  exists (select 1 from errands where errands.id = errand_id and errands.requester_id = auth.uid())
);

-- disputes: either party on the errand can open one; resolution admin-only.
create policy "disputes_insert" on disputes for insert with check (
  opened_by = auth.uid() and exists (
    select 1 from errands
    where errands.id = errand_id
    and (errands.requester_id = auth.uid() or errands.scout_id = auth.uid())
  )
);
create policy "disputes_read" on disputes for select using (
  exists (
    select 1 from errands
    where errands.id = errand_id
    and (errands.requester_id = auth.uid() or errands.scout_id = auth.uid())
  ) or is_admin()
);
create policy "disputes_admin_update" on disputes for update using (is_admin());

-- chat_messages: readable/writable only by the requester and scout on
-- that specific errand. Realtime channel subscriptions must be scoped
-- per-errand client-side to match this.
create policy "chat_messages_rw" on chat_messages for all using (
  exists (
    select 1 from errands
    where errands.id = errand_id
    and (errands.requester_id = auth.uid() or errands.scout_id = auth.uid())
  )
);

-- ratings: one per errand per rater; aggregate is public via view, notes are not.
create policy "ratings_insert" on ratings for insert with check (
  rated_by = auth.uid() and rated_by != rated_user_id and exists (
    select 1 from errands
    where errands.id = errand_id and errands.status = 'confirmed'
    and (errands.requester_id = auth.uid() or errands.scout_id = auth.uid())
  )
);
create policy "ratings_read" on ratings for select using (
  rated_by = auth.uid() or rated_user_id = auth.uid() or is_admin()
);

-- payout_batches / payout_batch_items: scout reads own; writes are
-- service-role-only, generated by the scheduled job (Section 8).
create policy "payout_batches_read" on payout_batches for select using (
  scout_id = auth.uid() or is_admin()
);
create policy "payout_batch_items_read" on payout_batch_items for select using (
  exists (
    select 1 from payout_batches
    where payout_batches.id = batch_id and payout_batches.scout_id = auth.uid()
  ) or is_admin()
);
