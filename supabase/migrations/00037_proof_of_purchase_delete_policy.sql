-- Same bug class as 00036, found by auditing every other upload site
-- after that one was reported rather than waiting for it to also get
-- hit in the wild. proof-of-purchase (00010) uses a fixed path
-- (errand_id/item.jpg, errand_id/receipt.jpg) with no remove-before-
-- upload and no scout-side delete policy — only admin could delete.
-- If a scout's submit partially failed (e.g. item.jpg uploads fine,
-- receipt.jpg or the errand-status update afterward fails) and they
-- retry, which the screen's own error handling explicitly allows
-- (stays mounted, re-enables the button), the item.jpg re-upload
-- attempt would hit the identical "resource already exists" error.
--
-- Deliberately scoped to status = 'accepted' only, NOT a blanket
-- own-errand policy — 00010's comment is explicit that proof photos
-- are meant to be immutable once submitted ("matching the ID-photo
-- retention principle... kept on file indefinitely"), for evidence
-- integrity if a dispute references them later. A scout's own
-- scout_id on the errand never changes, so an unscoped delete policy
-- would let them delete their own submitted evidence indefinitely,
-- even after admin or the requester has already seen it — this only
-- allows removal during the actual submission window, before the
-- status flip to 'purchased' that marks submission complete.

create policy "proof_of_purchase_scout_delete_own_in_progress" on storage.objects
  for delete
  using (
    bucket_id = 'proof-of-purchase'
    and exists (
      select 1 from errands
      where errands.id = (storage.foldername(name))[1]::uuid
      and errands.scout_id = auth.uid()
      and errands.status = 'accepted'
    )
  );
