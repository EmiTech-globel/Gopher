# Gopher Landing Page

Download page for Gopher's Android APK, per spec Section 21. Built
with Vite + React + TypeScript — no backend, no routing library, just
two separate builds (landing page and printable flyer) since they
have fundamentally different needs and shouldn't share a bundle.

## Structure

Multi-page static site. Every `*.html` file in this folder is its own
page (Vite builds them all, see `vite.config.ts`), and each page has a
tiny entry file in `src/entries/` that mounts a page component inside
the shared layout. The flyer is separate: it has its own print-only CSS
and does not use the site layout.

```
apps/landing/
├── index.html, download.html     Page shells (one per page)
├── flyer.html                    Printable campus poster
├── public/img/                   Photos and the app screenshot
└── src/
    ├── entries/                  One file per page: mount(<Page />)
    ├── pages/                    HomePage, DownloadPage
    ├── components/               SiteLayout (nav + footer), icons
    ├── site.ts                   Nav links, footer links, support contact
    ├── site.css                  Site styles (light theme)
    ├── config.ts                 APK_DOWNLOAD_URL lives here
    ├── QrCode.tsx                QR image used on the download page
    └── FlyerPage.tsx / tokens.css  Flyer page and brand colour variables
```

To add a page: add `<name>.html`, `src/entries/<name>.tsx` and a page
component, then link it from `src/site.ts`.

## Pages

- **Home** (`/`) — what Gopher is, how it works, trust and safety.
- **Download** (`/download`) — auto-triggers the APK download shortly
  after load (once `APK_DOWNLOAD_URL` is a real link), with a visible
  button as the fallback, install steps and a QR code that encodes the
  page's own URL.
- **Flyer** (`/flyer`) — print-optimized poster; its QR points at the
  download page.

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
