-- Restricted public views per Section 20 — expose only the safe subset of
-- profiles/scouts to other users, never phone/email/verification photos.

create view public_profiles as
  select id, full_name, avatar_url, department from profiles;

create view public_scouts as
  select profile_id, trust_tier, rating_avg, completed_errands_count from scouts;

-- Supabase's default template usually grants these automatically, but
-- made explicit here rather than assumed.
grant select on public_profiles to anon, authenticated;
grant select on public_scouts to anon, authenticated;