-- Dispute evidence support — the dedicated dispute-filing screen lets
-- either party attach photo evidence when opening a dispute, closing the
-- gap noted in the README ("no dedicated evidence-submission flow").
-- Same restricted-bucket pattern as proof-of-purchase (00010) and
-- balance-request-evidence (00014): readable only by the two assigned
-- parties on the errand plus admin, writable by whoever is inserting.

alter table disputes add column evidence_photo_urls text[];

insert into storage.buckets (id, name, public)
values ('dispute-evidence', 'dispute-evidence', false)
on conflict (id) do nothing;

create policy "dispute_evidence_party_insert"
on storage.objects for insert
with check (
  bucket_id = 'dispute-evidence'
  and exists (
    select 1 from errands
    where errands.id = (storage.foldername(name))[1]::uuid
    and (errands.requester_id = auth.uid() or errands.scout_id = auth.uid())
  )
);

create policy "dispute_evidence_read"
on storage.objects for select
using (
  bucket_id = 'dispute-evidence'
  and (
    exists (
      select 1 from errands
      where errands.id = (storage.foldername(name))[1]::uuid
      and (errands.requester_id = auth.uid() or errands.scout_id = auth.uid())
    )
    or is_admin()
  )
);
