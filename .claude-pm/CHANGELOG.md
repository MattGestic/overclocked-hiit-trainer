# Project-management changelog

## 2026-07-21

- Reconciled the starter framework into `MattGestic/overclocked-hiit-trainer`.
- Set `project.name`, `project.repository`, and `project.authoritativeSources` from verified repository sources.
- Merged `pm:validate`/`pm:dashboard` into the existing `package.json` scripts block; the framework's standalone `package.json` was not otherwise used.
- Marked WI-0001 done with evidence.
- Seeded WI-0003, WI-0004, WI-0005 from `docs/architecture.md`'s documented "explicitly deferred, flagged for confirmation" list and marked WI-0002 done; intentionally excluded the list's two explicitly-declined items (cooldown countdown, extended programme metadata) from the backlog.

## 2026-07-20

- Added the repository-local project-management framework.
- Added a schema-valid initial backlog containing only repository-reconciliation work.
- Added deterministic validation and dashboard generation with no external dependencies.
- Added templates for work items, status updates, and agent handoffs.
- Added a standalone `package.json`; merge it if installing into an existing application repository.
