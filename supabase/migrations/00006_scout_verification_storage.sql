-- Storage bucket + policies for scout selfie/ID verification photos.
-- Section 4: restricted, non-public, admin-only read. Scouts can only
-- write into their own folder (path prefixed by their own auth.uid()).

insert into storage.buckets (id, name, public)
values ('scout-verification', 'scout-verification', false)
on conflict (id) do nothing;

create policy "scout_verification_insert_own" on storage.objects
  for insert
  with check (
    bucket_id = 'scout-verification'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "scout_verification_admin_read" on storage.objects
  for select
  using (
    bucket_id = 'scout-verification'
    and is_admin()
  );

-- No update/delete policy yet — uploads are effectively immutable for
-- now. The 3-attempt resubmission flow (Section 4) will need to revisit
-- this; flagged for later, not v1-blocking.
