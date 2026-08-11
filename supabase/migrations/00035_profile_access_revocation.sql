-- Confirmed gap: the Accounts page (spec Section 13) is supposed to
-- cover "users and scouts" alike, but every admin control that
-- existed (ban, trust-tier) only worked on the scouts table — a plain
-- User's account page was 100% read-only, no way to act on a
-- misbehaving User (false disputes, cancellation abuse, etc).
--
-- These two columns are audit/display state only — the actual
-- enforcement is Supabase Auth's own ban_duration on auth.users,
-- set via the admin API (service-role only, see accounts/actions.ts
-- in the admin app). That's the authoritative layer GoTrue itself
-- checks on every sign-in attempt; these columns just let the admin
-- dashboard show *why* and *when* without a service-role query.
--
-- Deliberately NOT a real row deletion: spec Section 11 requires a
-- banned scout's selfie/ID to persist in the restricted archive
-- specifically to block re-registration under a new identity.
-- profiles.id -> auth.users(id) is ON DELETE CASCADE, so actually
-- deleting the auth user would destroy exactly the data spec says
-- must survive. Revoking sign-in access while leaving every row
-- intact is the correct implementation of "deletion" here, not a
-- shortcut around it.

alter table profiles add column access_revoked_at timestamptz;
alter table profiles add column access_revoked_reason text;

comment on column profiles.access_revoked_at is
  'Mirrors an admin-issued Supabase Auth ban_duration on auth.users — set here for dashboard display/audit only, not itself the enforcement mechanism.';

create or replace function protect_admin_only_profile_columns()
returns trigger as $$
begin
  if is_admin() then
    return new;
  end if;

  if new.access_revoked_at is distinct from old.access_revoked_at
     or new.access_revoked_reason is distinct from old.access_revoked_reason
  then
    raise exception 'access_revoked_at and access_revoked_reason are admin-only writes';
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_protect_admin_only_profile_columns
  before update on profiles
  for each row
  execute function protect_admin_only_profile_columns();
