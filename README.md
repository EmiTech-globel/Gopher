# Gopher

Campus errand & delivery app for PTI Effurun. Owner: TrixStudio.

Full product/business spec: `gopher-project-spec.docx` (kept outside this
repo — planning doc, not code).

## Structure

```
gopher/
├── apps/
│   ├── mobile/        Expo (React Native) app — both User and Scout roles,
│   │                  role-gated via route groups: (auth) (user) (scout)
│   └── admin/         Next.js admin dashboard, deployed on Vercel
├── packages/
│   ├── shared-types/  Database types (generated) + domain enums, imported
│   │                  by both apps so they can never drift out of sync
│   ├── supabase-client/  Platform-agnostic client factory + shared query
│   │                  functions; each app injects its own auth storage
│   │                  adapter (SecureStore for mobile, cookies for admin)
│   └── config/        Shared tsconfig base
└── supabase/
    ├── migrations/    Schema + RLS, applied in numeric order
    └── functions/     Edge Functions — Paystack webhook, transfers, the
                       weekly payout batch job. Server-side only; this is
                       the one place the Paystack secret key lives.
```

## Setup

```bash
pnpm install

cp apps/mobile/.env.example apps/mobile/.env
cp apps/admin/.env.example apps/admin/.env.local

# Push the schema to a Supabase project, then generate types:
supabase link --project-ref <project-ref>
supabase db push
pnpm db:types
```

## Running

```bash
pnpm dev:mobile   # expo start
pnpm dev:admin    # next dev
```

## Notes for whoever picks this up (including future Emmy)

- **Trust-tier logic, escrow release timing, the one-week payout delay,
  and cancellation rules are all documented in the spec doc, not just in
  code comments.** If a business rule looks arbitrary in the code, check
  the doc before assuming it's wrong.
- **The errand state machine IS now enforced at the database level** —
  see `supabase/migrations/00026_errand_state_machine.sql`. The old
  `00004_state_machine_triggers.sql` flag comment is superseded; that
  file is kept only as a historical marker of when this was still open.
- **Trust-tier auto-upgrade is automated** — see
  `supabase/migrations/00027_trust_tier_auto_upgrade.sql`. A scout hitting
  3 completed errands with no unresolved dispute flips from `new` to
  `trusted` automatically, no admin action required.
- **Delivery fee calculation IS implemented** — see
  `apps/mobile/src/data/campus-zones.ts` for the real PTI building
  clusters (A–J) and the 3-tier proximity model.
- No emojis, anywhere, in any UI copy or code comments. Tabler Icons only.

## Build Order — Screens (Shared, per spec Section 16)

Screens must be built in this order since each depends on the one before:

1. **Splash / loading screen** — brand mark, shown briefly on every app open.
2. **Onboarding intro** (3-slide carousel) — first launch only, before login.
3. **Login** — email/username + password.
4. **Create account** — default User signup, with "Become a scout" link.
5. **Scout registration** — matric number, department, live selfie/ID capture.
6. **Verification pending / rejected** — scout-only states after registration.

Everything after this point (Home, Post an errand, Browse errands, etc.)
depends on knowing who's logged in and which role they're in, so auth
and onboarding come first, before any role-specific screens.

## Known Blockers (as of Aug 2026)
   - **Paystack Transfers require CAC business registration to go live.**
     Currently Starter Business (no CAC) — dashboard shows Transfer
     permissions enabled despite this, which contradicts documentation;
     a real test transfer is needed to confirm actual capability before
     assuming CAC is still a blocker. This is the one remaining hard
     gate before production.
   - Custom SMTP domain verification: DONE. trixstudio.abrdns.com
     verified in Resend, SPF/DKIM/DMARC all configured and confirmed via
     mail-tester.com (10/10). Real emails now deliver to inbox, not just
     the Resend account owner's address.
   - Delivery fee zones/coordinates: DONE — see
     `apps/mobile/src/data/campus-zones.ts`.
   - Errand state machine enforcement: DONE — see
     `supabase/migrations/00026_errand_state_machine.sql`.
   - Trust-tier auto-upgrade: DONE — see
     `supabase/migrations/00027_trust_tier_auto_upgrade.sql`.
   - Terms & Conditions acceptance screen: built (`(auth)/terms-and-conditions.tsx`),
     not yet pushed to the live branch as of this note.
   - Admin dashboard (`apps/admin`): not yet built.
   - Bidirectional rating (User→Scout only, or both directions): still an
     open design decision, not yet built either way.
