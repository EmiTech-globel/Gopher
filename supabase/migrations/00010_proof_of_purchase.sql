-- Proof of Purchase storage bucket (Section 5) — camera-only capture of
-- item + receipt photos, shown to new-tier scouts before an errand moves
-- to "purchased". Restricted, non-public, same pattern as the existing
-- scout-verification bucket: readable only by the two assigned parties
-- on that specific errand (and admin), writable only by the assigned
-- scout, matching this app's existing "everything scoped per errand"
-- convention (chat_messages, disputes, balance_requests all work this way).

insert into storage.buckets (id, name, public)
values ('proof-of-purchase', 'proof-of-purchase', false)
on conflict (id) do nothing;

-- Path convention: {errand_id}/item.jpg, {errand_id}/receipt.jpg
-- storage.foldername(name) splits the object path into an array of
-- folder segments — [1] is the first segment, i.e. the errand_id.

create policy "proof_of_purchase_scout_insert"
on storage.objects for insert
with check (
  bucket_id = 'proof-of-purchase'
  and exists (
    select 1 from errands
    where errands.id = (storage.foldername(name))[1]::uuid
    and errands.scout_id = auth.uid()
  )
);

create policy "proof_of_purchase_read"
on storage.objects for select
using (
  bucket_id = 'proof-of-purchase'
  and (
    exists (
      select 1 from errands
      where errands.id = (storage.foldername(name))[1]::uuid
      and (errands.requester_id = auth.uid() or errands.scout_id = auth.uid())
    )
    or is_admin()
  )
);

-- No update policy — proof photos are immutable once submitted, matching
-- the ID-photo retention principle already established for scout
-- verification (Section 4: "kept on file indefinitely, not deleted").
-- Re-taking a photo before submission just re-uploads to the same path
-- client-side; this migration doesn't need to allow overwriting stored
-- objects after the fact.

create policy "proof_of_purchase_admin_delete"
on storage.objects for delete
using (bucket_id = 'proof-of-purchase' and is_admin());