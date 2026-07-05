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
- **The errand state machine is NOT yet enforced at the database level.**
  See `supabase/migrations/00004_state_machine_triggers.sql` — this is
  flagged intentionally, not forgotten.
- **Delivery fee calculation is not yet implemented.** The zone/coordinate
  model is decided (see spec Section on Charges Fee) but exact zones and
  coordinates are pending a walkthrough.
- No emojis, anywhere, in any UI copy or code comments. Tabler Icons only.
