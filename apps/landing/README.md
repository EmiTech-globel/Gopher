# Gopher Landing Page

Download page for Gopher's Android APK, per spec Section 21. Built
with Vite + React + TypeScript — no backend, no routing library, just
two separate builds (landing page and printable flyer) since they
have fundamentally different needs and shouldn't share a bundle.

## Structure

```
apps/landing/
├── index.html / flyer.html   Vite entry points (thin HTML shells)
├── src/
│   ├── LandingPage.tsx        The actual download page
│   ├── FlyerPage.tsx          Print-optimized campus poster
│   ├── QrCode.tsx             Shared — generates a QR client-side
│   ├── config.ts              APK_DOWNLOAD_URL lives here
│   ├── tokens.css             Brand color variables
│   └── landing-main.tsx /
│       flyer-main.tsx         React mount points
```

## Pages

- **Landing page** — auto-triggers the APK download shortly after
  load, with a visible "Download for Android" button as the fallback
  for browsers that block that. Install-from-unknown-sources steps,
  and a QR code that encodes the landing page's own URL (not the raw
  APK link) — so scanning it gets the fallback button and instructions
  too, not just a bare file some browsers flag as an unrecognized
  download with no context.
- **Flyer** — print-optimized poster. Light background (dark wastes
  ink and prints poorly on typical printers, unlike the brand-dark
  theme used everywhere else in this project), large QR, minimal
  text, one-page A4 layout. Its QR points at the landing page, not
  itself.

## One thing you MUST fill in before deploying

Open `src/config.ts`:

```typescript
export const APK_DOWNLOAD_URL = "REPLACE_WITH_REAL_APK_URL";
```

Replace with a direct link to your production `.apk`. Options, roughly
in order of setup effort:

1. **EAS build artifact URL** — after `eas build --profile production
   --platform android` finishes, EAS gives you a direct download link.
   Simplest to start with; Expo's hosting isn't guaranteed permanent,
   worth migrating off later.
2. **Supabase Storage** — upload the `.apk` to a public bucket, use
   the public URL. Free, and you already control this project directly.
3. **Vercel's own `public/` folder** — technically works, but Vercel's
   free tier bandwidth is meant for web assets, not repeated binary
   downloads of an app-sized file. Supabase Storage is the better fit.

Until this is filled in, the auto-download script checks for the
placeholder first and does nothing, rather than trying to download a
broken link.

## Local development

```bash
cd apps/landing
pnpm install
pnpm dev        # landing page at /, flyer at /flyer.html
```

## Deploying

Same Vercel pattern as the admin dashboard:

1. Vercel → New Project → Import this repo
2. **Root Directory:** `apps/landing`
3. **Framework Preset:** Vite (auto-detected)
4. Deploy — `vercel.json` already sets the build command and output
   directory

## Domain

Suggest a short, easy-to-say subdomain for verbal/flyer sharing —
something like `get.trixstudio.abrdns.com` — same CNAME-in-ClouDNS
process already used for `admin.trixstudio.abrdns.com`.

## A note on the QR code service

Both pages generate their QR via `api.qrserver.com`, a free public
API — no signup, no key. This only matters at preview/load time; once
`flyer.html` is actually printed, the QR is static ink on paper with
no ongoing dependency on that service. Swapping in a client-side QR
library is a quick follow-up if you'd rather not depend on it even
at preview-time.
