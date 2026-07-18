# Deployment

## Deploy target: Vercel

This repo deploys via a **Vercel project already connected to it**, auto-
deploying on every push to `main` (and preview URLs per-PR, visible as
`vercel[bot]` comments). The custom domain is `overclockedhittfit.life`.

A GitHub Pages workflow (`deploy.yml`) and `public/CNAME` existed earlier in
this build as a second candidate deploy path, targeting a different domain
(`www.overclockedhittfit.fit`). That path has been removed — Vercel is the
decided answer, and running two deploy pipelines against different domains
only invited confusion. Nothing in this repo drives the Vercel deploy;
config lives entirely in the Vercel dashboard.

## Remaining manual steps

1. **Environment variables** — in the Vercel dashboard (Project → Settings →
   Environment Variables), set for the Production environment:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

   pointed at Supabase project `xilnfrswpirjhzitxahh`. Without these, the
   app renders "Supabase is not configured" instead of the Login screen —
   `src/lib/supabaseClient.js` deliberately returns `null` rather than
   throwing when either var is missing, and `App.jsx` shows that message
   for exactly that case. After setting them, trigger a redeploy (env var
   changes don't apply to already-built deployments — push a commit or use
   the dashboard's "Redeploy" action).
2. **Custom domain** — confirm `overclockedhittfit.life` is attached under
   the Vercel project's Domains settings (it already resolves there, so
   this is likely already done — just double-check the target isn't
   pointed at a stale deployment).

## Supabase Auth redirect config

Once the domain is live and returning the Login screen, in the Supabase
dashboard (Authentication → URL Configuration) for project
`xilnfrswpirjhzitxahh`:

- **Site URL**: `https://overclockedhittfit.life`
- **Redirect URLs**: add the same, and keep `http://localhost:5173` for
  local dev.

This is a dashboard-only step — not something a workflow file can do.

## Before merging further feature branches into `main`

Run the full on-device acceptance checklist in
[`docs/test-plan.md`](test-plan.md) on a real Android phone with Spotify
playing. This can't be done from a CI runner or this build environment —
it's the last gate before calling v1 done.
