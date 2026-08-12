-- 00006 flagged this exact gap when the bucket was first created:
-- "No update/delete policy yet — uploads are effectively immutable
-- for now. The 3-attempt resubmission flow will need to revisit
-- this." That deferred item is now a confirmed live bug: id-capture.tsx's
-- uploadPhoto() calls storage.remove([path]) before re-uploading on
-- resubmission, expecting to clear the old file first, but with no
-- DELETE policy that remove() call is silently denied by RLS (the
-- code doesn't check its result) — the old file never actually goes
-- away, and the follow-up upload(..., { upsert: false }) then
-- correctly throws "The resource already exists", since it genuinely
-- still does.

create policy "scout_verification_delete_own" on storage.objects
  for delete
  using (
    bucket_id = 'scout-verification'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
