# Contributing

## Branch and deploy model

```
feature branch  →  user-testing (staging)  →  main (production)
                   overclockedhittfit.fit      overclockedhittfit.life
```

- **`main`** is production. Every merge triggers a deploy to `overclockedhittfit.life`.
  No direct pushes — always PR.
- **`user-testing`** is staging. Merging here deploys to `overclockedhittfit.fit`.
  Verify there before opening a PR to `main`.
- **Feature branches** get per-PR Vercel preview URLs automatically.

**The rule:** nothing goes to `.life` without first being verified on `.fit`.

### Normal flow

```bash
git checkout -b feature/my-change
# ... work ...
gh pr create --base user-testing    # 1. lands on staging
# verify on https://overclockedhittfit.fit
gh pr create --base main            # 2. promote to production
```

Keep feature branches short-lived. If carrying a large multi-part build,
land it as a sequence of small commits that each keep lint/test/build passing
— a branch that's "done" at every commit is easier to review and recover from.

## Before opening a PR

```bash
npm run lint
npm run test
npm run build
```

All three must pass. CI (`.github/workflows/ci.yml`) enforces this, but
catching it locally first is faster than waiting on a CI round-trip.

If your change touches anything timer/audio/wake-lock related, also run
through the relevant checklist items in
[`docs/test-plan.md`](docs/test-plan.md) — most of that surface can't be
verified by lint/build/tests alone.

## Vendored shared-ui

`src/shared-ui/` is a vendored copy, not a package dependency — see
[`docs/decisions/0002-vendor-shared-ui-not-monorepo.md`](docs/decisions/0002-vendor-shared-ui-not-monorepo.md).
If you fix something in there that looks like it'd apply to the source
design system too (not something HIIT-specific), note it in your PR
description so it can be ported back manually.

## Commit messages

Explain *why*, not just *what* — the diff already shows what changed.
Worth a sentence when a change fixes a bug found through actual testing
(what broke, how you confirmed the fix) rather than just "fix bug."
