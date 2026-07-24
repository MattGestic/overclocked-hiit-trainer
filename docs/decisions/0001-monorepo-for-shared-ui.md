# ADR 0001: Move shared-ui and both apps into a monorepo

## Context

`overclocked-hiit-trainer` depends on `@overclocked/shared-ui` via
`file:../overclocked-shared-ui` — a local path reference that only resolves
when that sibling directory happens to exist next to the checkout. This
broke immediately in CI (`ci.yml`) and in the new `deploy-user-testing.yml`
workflow, because a CI runner (or Vercel/Netlify) checks out exactly one
repo — there is no sibling `overclocked-shared-ui` directory to link to.

A second app is planned to consume the same shared-ui package, so this
problem will recur for every consumer and every CI/deploy target.

## Options considered

### Option 1: Publish shared-ui as a versioned package (GitHub Packages/npm)

**Pros**
- Works with zero CI changes beyond `npm ci` — any runner, any host resolves
  it like a normal dependency.
- Clean separation: shared-ui has its own release cadence and semver. Apps
  opt into upgrades deliberately.
- Apps can sit on different shared-ui versions at the same time.
- Repos stay independent — smaller, focused checkouts and CI per repo.

**Cons**
- Extra step in the loop: change → bump version → publish → bump the
  version in each consuming app → install. Slows down active co-development.
- Easy to test against a stale published version without noticing a
  component changed.
- Needs registry plumbing (GitHub Packages auth token in every consuming
  repo's CI).
- Version drift risk: apps quietly diverge on shared-ui versions.

### Option 2: npm/pnpm workspaces monorepo (shared-ui + both apps, one repo)

**Pros**
- No publish step — a component change is picked up by both apps on the
  next build/dev-server reload.
- One CI run, one `npm ci` — the class of bug that started this (an
  unresolvable `file:` path) becomes structurally impossible.
- Atomic commits: a breaking shared-ui change and its fix in both apps land
  in the same PR, same CI run.
- Single source of truth for shared dependency versions (react, tailwind,
  etc.) across all packages.

**Cons**
- One-time restructure: three existing repos become workspace packages in
  one repo; git history has to be merged or split (`git subtree`/
  `filter-repo` can preserve it, but it's work).
- Coarser access control — can't grant access to one app without also
  granting access to shared-ui and the other app (less relevant while both
  apps are the same owner).
- CI gets slightly more involved if the apps ever need very different
  build/test pipelines.

## Decision

Move to **Option 2: npm/pnpm workspaces monorepo**. Both apps are under
active co-development with shared-ui right now, so the fast inner loop and
the structural elimination of the `file:` path bug outweigh the one-time
restructuring cost. Revisit Option 1 if shared-ui stabilizes and the apps
need to move independently of it.

## Branching strategy for the monorepo

Once merged, the monorepo has **one trunk (`main`)** — not one main branch
per former repo. Per-repo mains would recreate the exact cross-repo drift
this migration is meant to eliminate.

1. **One trunk, `main`.** All packages (`packages/shared-ui`,
   `apps/hiit-trainer`, `apps/<app-2>`) version together in one history, so
   a shared-ui change and its consuming update in both apps can land as one
   PR.

2. **Short-lived feature branches, not long-lived per-app branches.**
   Branch off `main`, PR back into `main`, merge, delete. Avoid a
   persistent `hiit-trainer-develop` that diverges from `main` for weeks —
   a shared-ui fix on `main` won't reach a long-diverged app branch without
   manual merging.

3. **Path-scoped CI.** Use GitHub Actions `paths:` filters (or an
   affected-package tool such as Turborepo/Nx) so a change under
   `apps/hiit-trainer/**` only builds/deploys that app, while a change
   under `packages/shared-ui/**` triggers both apps' builds.

4. **Testing branches are deploy pointers, not dev branches.** Each app
   keeps its own (e.g. `hiit-trainer-user-testing`, `<app-2>-user-testing`),
   fast-forwarded/merged from `main` when a new snapshot should reach
   testers, each with its own deploy workflow and its own Supabase test
   project secrets. New work isn't committed directly to these branches.

5. **Scope secrets with GitHub Environments** (one per app+testing-branch)
   rather than uniquely-prefixed secret names — cleaner as more apps are
   added.
