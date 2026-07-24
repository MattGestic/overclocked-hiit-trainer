## Summary

<!-- What changed and why. Link to any relevant issue/discussion. -->

## Target branch

- [ ] This PR targets **`user-testing`** (staging — verify on `.fit` first)
- [ ] This PR targets **`main`** (production — only after `.fit` verification)

## Test plan

- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] If targeting `main`: changes were verified on `overclockedhittfit.fit` (staging)
- [ ] If this touches timer/audio/wake-lock behaviour: relevant checklist
      items in [`docs/test-plan.md`](../docs/test-plan.md) were run
- [ ] If this touches `src/shared-ui/`: noted below whether the fix should
      be ported back to the source design system
      (see [ADR 0002](../docs/decisions/0002-vendor-shared-ui-not-monorepo.md))

## Screenshots (for UI changes)

<!-- Before/after if relevant. For production PRs, include a screenshot from staging (.fit). -->
