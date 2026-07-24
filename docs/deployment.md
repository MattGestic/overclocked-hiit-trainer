# Deployment

## Environments

| Domain | Branch | Purpose |
|---|---|---|
| `overclockedhittfit.life` | `main` | **Production** — real users |
| `overclockedhittfit.fit` | `user-testing` | **Staging** — acceptance testing before going live |
| `*.vercel.app` preview URLs | any branch | **Preview** — per-PR previews, auto-created by Vercel |

Vercel is the sole deploy target. Every push to any branch triggers a build;
only `main` and `user-testing` have custom domains attached.

---

## Branch → domain rules (enforced by Vercel)

```
feature/* or claude/*
        │
        ▼  PR + CI
  user-testing  ──→  overclockedhittfit.fit  (staging/acceptance)
        │
        ▼  PR + CI
      main  ──→  overclockedhittfit.life  (production)
```

**Never push directly to `main`.** Always PR → review → merge.
**Treat `user-testing` as the gate before production.** Anything going to
`.life` should have been visible and verified on `.fit` first.

---

## Supabase environment variables

Set in the Vercel dashboard under **Project → Settings → Environment Variables**
for the **Production** environment only:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Both point at Supabase project `xilnfrswpirjhzitxahh`. Without these the
app renders "Supabase is not configured" — `src/lib/supabaseClient.js`
returns `null` when either var is absent, and `App.jsx` catches that case.

Environment variable changes don't apply to already-built deployments — push
a new commit or use the Vercel dashboard's **Redeploy** button after updating.

For staging (`user-testing` / `.fit`), add the same vars scoped to
**Preview** environment in Vercel, or point them at a separate Supabase
project if you want staging to have isolated data.

---

## Supabase Auth redirect config

In the Supabase dashboard (Authentication → URL Configuration) for project
`xilnfrswpirjhzitxahh`:

- **Site URL**: `https://overclockedhittfit.life`
- **Redirect URLs** (add all of):
  - `https://overclockedhittfit.life`
  - `https://overclockedhittfit.fit`
  - `http://localhost:5173`

---

## Local dev

```bash
npm install
cp .env.example .env          # fill in your Supabase credentials
npm run dev                   # http://localhost:5173
```

`npm run build` produces the static bundle Vercel deploys. If it fails
locally it will fail on Vercel — always run it before pushing.

---

## Merging to user-testing

Feature work should land on `user-testing` first:

```bash
# On your feature branch, after CI passes:
gh pr create --base user-testing
# After it merges, verify on https://overclockedhittfit.fit
```

When staging is confirmed good, open a second PR from `user-testing` → `main`.

---

## Before merging to main (production gate)

Run the full on-device acceptance checklist in [`docs/test-plan.md`](test-plan.md)
on a real Android phone with Spotify playing. CI can't cover timer, audio,
or wake-lock behaviour — that surface requires the checklist.
