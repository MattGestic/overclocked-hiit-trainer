# Deployment

## Open question: two deploy targets exist — pick one

During this build, PR activity revealed a **Vercel project (`overclocked-hitt-fit`)
is already connected to this repo and auto-deploying** a preview URL on
every push (visible as `vercel[bot]` comments on PRs #3/#4). This wasn't
something set up as part of this build — it already existed. Separately,
`.github/workflows/deploy.yml` (inherited from the `user-testing` branch,
reworked here) deploys to GitHub Pages.

**Both can't be the real answer** — pick one before going live, or the
`www.overclockedhittfit.fit` domain will only ever point at one of them
regardless of which pipeline "succeeds":

- **Vercel** — zero-config, already working, gets preview URLs per-PR for
  free. Custom domain + env vars are configured in the Vercel dashboard,
  not in this repo — nothing here to change if this is the answer.
- **GitHub Pages** — `deploy.yml`, now targets `main` (was `user-testing`),
  builds with the current env var names, no longer forces the
  `/overclocked-hiit-trainer/` subpath (a custom domain serves from root).
  `public/CNAME` is in place so the custom domain survives redeploys.

If Vercel is the answer, `deploy.yml` and `public/CNAME` can be deleted.
If GitHub Pages is the answer, the Vercel project's auto-deploy should
probably be disconnected to avoid two builds racing to serve the same
domain from different states.

## GitHub Pages path — remaining manual steps

1. **Rename the GitHub Actions secrets** (Settings → Secrets and variables
   → Actions) from `USER_TESTING_SUPABASE_URL` / `USER_TESTING_SUPABASE_ANON_KEY`
   to `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`, pointed at project
   `xilnfrswpirjhzitxahh`.
2. **DNS**: add a `CNAME` record at your domain registrar for
   `www.overclockedhittfit.fit` → `mattgestic.github.io`. This is outside
   the repo and can't be scripted here.
3. Enable GitHub Pages (Settings → Pages) with source "GitHub Actions" if
   not already set.

## Vercel path — remaining manual steps

1. Confirm/set the project's environment variables in the Vercel dashboard:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, pointed at project
   `xilnfrswpirjhzitxahh`.
2. Add the custom domain in the Vercel dashboard's Domains settings.

## Either path — Supabase Auth redirect config

Once whichever domain is live, in the Supabase dashboard
(Authentication → URL Configuration) for project `xilnfrswpirjhzitxahh`:

- **Site URL**: `https://www.overclockedhittfit.fit`
- **Redirect URLs**: add the same, and keep `http://localhost:5173` for
  local dev.

This is a dashboard-only step — not something a workflow file can do.

## Before merging the feature branch into `main`

Run the full on-device acceptance checklist in
[`docs/test-plan.md`](test-plan.md) on a real Android phone with Spotify
playing. This can't be done from a CI runner or this build environment —
it's the last gate before calling v1 done.
