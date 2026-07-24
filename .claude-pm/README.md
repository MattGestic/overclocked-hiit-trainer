# Project-management framework

This directory is a small repository-local coordination layer. It provides one structured backlog and a generated read-only dashboard without becoming a second requirements system.

## Files

- `STATUS.md` — current snapshot, risks, and next actions.
- `ROADMAP.md` — outcome sequence and exit conditions.
- `WORK_ITEMS.json` — canonical structured backlog.
- `LOCKED.md` — constraints that must not drift silently.
- `CHANGELOG.md` — material framework and delivery updates.
- `dashboard.html` and `dashboard-data.js` — generated visual view.
- `generate-dashboard.mjs` — validator and dashboard-data generator.
- `templates/` — reusable work-item, status, and handoff templates.
- `archive/` — superseded narrative snapshots retained for history.

## Commands

```text
npm run pm:validate
npm run pm:dashboard
```

Validation checks required fields, ID uniqueness, allowed values, dependency references, and dependency cycles. Generation performs the same checks and rewrites `dashboard-data.js` deterministically. Open `dashboard.html` after generation; it needs no server or network access.

## Operating rules

1. `WORK_ITEMS.json` is the canonical backlog. Never manually edit `dashboard-data.js`.
2. Use stable IDs of the form `WI-0001`; never recycle an ID.
3. Keep items outcome-focused and independently verifiable.
4. Every completed item needs evidence.
5. Link to authoritative repository sources instead of copying them.
6. Update `STATUS.md` when priorities, risks, or next actions change.
7. Record only material changes in `CHANGELOG.md`.

