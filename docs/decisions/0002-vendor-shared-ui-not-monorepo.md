# ADR 0002: Vendor shared-ui into each app instead of migrating to a monorepo

## Context

ADR 0001 recorded a decision to move `shared-ui` and both consuming apps
into a single npm/pnpm workspaces monorepo, to structurally eliminate the
unresolvable `file:../overclocked-shared-ui` path dependency and give both
apps a fast, no-publish-step inner loop.

That migration hasn't happened. What actually landed instead, on the
`develop` branch before this build started, is: `shared-ui`'s components,
hooks, theme tokens, and utils were copied directly into
`src/shared-ui/` in this repo, and the broken `file:` dependency was
dropped from `package.json` entirely. This is the option ADR 0001's own
comparison explicitly evaluated and rejected (Option 1's cousin —
effectively a one-time, unversioned "publish" via copy-paste rather than a
registry).

## Decision

Accept the vendored copy as the interim approach for this build, rather
than either reverting it to force the monorepo migration or pretending
ADR 0001 still reflects reality.

Rationale for not blocking on the monorepo migration right now:

- The vendored copy already solves the specific bug that motivated ADR
  0001 — CI and Vercel builds no longer depend on a sibling directory that
  doesn't exist on a fresh checkout.
- A monorepo migration is a real, separate piece of work (repo
  restructuring, git history handling per ADR 0001's own cons list) that
  would have blocked every feature slice in this build on an unrelated
  infrastructure change.
- The cost ADR 0001 was actually worried about — shared-ui drift between
  apps — is real with vendoring (a copy can silently diverge from its
  source, with no version marker forcing anyone to notice), but it's a
  cost that accrues gradually, not a blocker for a single app's first
  build.

## Consequences

- **Do not hand-edit vendored files as if they're local to this app** without
  considering whether the fix belongs upstream too (e.g. the `Toast.jsx`
  hardcoded pixel offset fixed during this build, or the `[data-density]`
  token block added to `tokens.css`) — changes here won't propagate to
  the other app consuming shared-ui, and the other app's independent copy
  won't propagate back here either.
- **ADR 0001's monorepo migration remains a valid future option** — revisit
  it if shared-ui drift between apps becomes a real, felt problem rather
  than a theoretical one. Until then, this ADR is the record of what
  actually shipped instead.
