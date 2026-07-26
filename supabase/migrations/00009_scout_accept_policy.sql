-- errands_update only ever covered the two already-assigned parties.
-- It never actually permitted a scout to claim an *open*, unassigned
-- errand in the first place — accepting an errand was structurally
-- blocked by RLS, not racing against other scouts as the client-side
-- error message assumed.
create policy "errands_scout_accept" on errands for update
using (
  status = 'open'
  and scout_id is null
  and exists (
    select 1 from scouts
    where scouts.profile_id = auth.uid()
    and scouts.verification_status = 'approved'
  )
)
with check (
  scout_id = auth.uid()
  and status = 'accepted'
);