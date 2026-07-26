-- balance-request-evidence bucket (Section 6: price-overrun requests
-- must attach photo/video evidence). Same restricted pattern as
-- proof-of-purchase and scout-verification: readable only by the two
-- assigned parties on the errand, writable only by the scout.

insert into storage.buckets (id, name, public)
values ('balance-request-evidence', 'balance-request-evidence', false)
on conflict (id) do nothing;

create policy "balance_evidence_scout_insert"
on storage.objects for insert
with check (
  bucket_id = 'balance-request-evidence'
  and exists (
    select 1 from errands
    where errands.id = (storage.foldername(name))[1]::uuid
    and errands.scout_id = auth.uid()
  )
);

create policy "balance_evidence_read"
on storage.objects for select
using (
  bucket_id = 'balance-request-evidence'
  and (
    exists (
      select 1 from errands
      where errands.id = (storage.foldername(name))[1]::uuid
      and (errands.requester_id = auth.uid() or errands.scout_id = auth.uid())
    )
    or is_admin()
  )
);