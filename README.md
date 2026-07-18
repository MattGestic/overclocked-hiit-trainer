# OVER•CLOCK — HIIT Trainer

An interval-workout timer app: build programmes (HIIT/TABATA/CIRCUIT/AMRAP/EMOM),
run them with audio cues and screen-wake-lock survival, and track history over time.

## Stack

- [Vite](https://vitejs.dev/) + React 19
- [Tailwind CSS 4](https://tailwindcss.com/) + a vendored design-token system
  (`src/shared-ui/`, shared with the RepStack app — see
  [`docs/decisions/0002-vendor-shared-ui-not-monorepo.md`](docs/decisions/0002-vendor-shared-ui-not-monorepo.md))
- [Supabase](https://supabase.com/) (Postgres + Auth) — no separate backend
- [Vitest](https://vitest.dev/) for unit tests

## Local development

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + publishable key
npm run dev
```

For phone testing on the same network:

```bash
npm run dev -- --host
```

then open the printed `http://192.168.x.x:5173` URL on your phone (confirm phone
and laptop are on the same Wi-Fi first).

### Database

Run [`supabase/schema.sql`](supabase/schema.sql) once in your project's SQL Editor
(Supabase dashboard → SQL Editor). It's idempotent — safe to re-run.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (currently: timer phase-sequencing + cue-mapping) |
| `npm run preview` | Serve the production build locally |

## Docs

- [`docs/requirements.md`](docs/requirements.md) — MVP user requirements
- [`docs/architecture.md`](docs/architecture.md) — file layout, data flow, key design decisions
- [`docs/test-plan.md`](docs/test-plan.md) — what's automated vs. what needs manual/on-device verification
- [`docs/deployment.md`](docs/deployment.md) — deploy targets and the manual steps before going live
- [`docs/decisions/`](docs/decisions/) — ADRs

## Known limitations (tracked, not accidental)

- **Audio cues are unverified by ear.** `src/lib/audioEngine.js` is wired
  to real decoded MP3/WAV cues and confirmed working end-to-end (all assets
  fetch/decode successfully, phase transitions fire the right function calls)
  — but nothing in this build environment can actually play sound, so
  whether the cues sound right, duck Spotify correctly, and land on the
  right beat is still an on-device check away. See `docs/test-plan.md`.
- **Delete-and-reinsert saves.** `programmesApi.js`'s `saveProgramme` isn't
  wrapped in a transaction — see `docs/architecture.md` for the tradeoff and
  the fast-follow (a Postgres RPC).
- Palette/font pickers in Settings are display-only beyond the single
  existing option — no second palette or font pairing exists yet to switch to.
