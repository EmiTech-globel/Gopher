-- Two fixes surfaced while building the admin Verification queue:
--
-- 1. Spec Section 4 requires a rejected applicant to be told the
--    specific reason ("Reject — applicant is told the specific reason
--    and can resubmit"), but no column existed anywhere to store one.
--    Without this, an admin's rejection had nowhere to go — the reject
--    action would be functionally silent to the scout.
--
-- 2. Spec Section 20 states verification_status, trust_tier, and
--    banned_at are "admin-only writes" — but the existing RLS policy
--    (scouts_own_update in 00002_rls_policies.sql) only checks ROW
--    ownership (profile_id = auth.uid()), not which COLUMNS changed.
--    RLS's `using` clause can't express column-level restrictions on
--    its own, so a scout could currently self-approve their own
--    verification or self-upgrade their trust tier via a raw client
--    update call. This trigger closes that gap.

alter table scouts add column rejection_reason text;

comment on column scouts.rejection_reason is
  'Set by an admin on rejection (spec Section 4). Shown to the applicant on the verification-rejected screen alongside their remaining resubmission attempts.';

create or replace function protect_admin_only_scout_columns()
returns trigger as $$
begin
  if is_admin() then
    return new;
  end if;

  -- The one legitimate self-write: a scout resubmitting after rejection
  -- flips their own verification_status from 'rejected' back to
  -- 'pending' as part of the resubmit action (see id-capture.tsx) —
  -- everything else about this column, and every other protected
  -- column, stays admin-only.
  if old.verification_status = 'rejected' and new.verification_status = 'pending' then
    if new.trust_tier is distinct from old.trust_tier
       or new.banned_at is distinct from old.banned_at
       or new.rejection_reason is distinct from old.rejection_reason
    then
      raise exception 'trust_tier, banned_at, and rejection_reason are admin-only writes';
    end if;
    return new;
  end if;

  if new.verification_status is distinct from old.verification_status
     or new.trust_tier is distinct from old.trust_tier
     or new.banned_at is distinct from old.banned_at
     or new.rejection_reason is distinct from old.rejection_reason
  then
    raise exception 'verification_status, trust_tier, banned_at, and rejection_reason are admin-only writes';
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_protect_admin_only_scout_columns
  before update on scouts
  for each row
  execute function protect_admin_only_scout_columns();
