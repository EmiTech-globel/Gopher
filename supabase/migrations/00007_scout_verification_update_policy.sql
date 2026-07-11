-- Allows a scout to overwrite their own selfie/ID in the
-- scout-verification bucket (needed for upsert:true uploads, and for
-- the resubmission flow in Section 4 — up to 3 resubmission attempts).

create policy "scout_verification_update_own" on storage.objects
  for update
  using (
    bucket_id = 'scout-verification'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'scout-verification'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
