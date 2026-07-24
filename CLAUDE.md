# Repository Working Agreement

This repository uses `.claude-pm/` as its lightweight project-management layer.

## Authority

Project-management files summarize work; they do not replace product or engineering documentation. When present, requirements, architecture, ADRs, test plans, deployment documentation, schemas, and contribution guidance are authoritative.

## Required workflow

1. Read `.claude-pm/STATUS.md`, `.claude-pm/ROADMAP.md`, and `.claude-pm/WORK_ITEMS.json` before starting material work.
2. Select an existing work item or create one with a unique ID before changing the application.
3. Keep scope, status, dependencies, acceptance criteria, and evidence current.
4. Never edit generated files directly. Run `npm run pm:dashboard` after changing tracker data.
5. Record completed framework or delivery changes in `.claude-pm/CHANGELOG.md`.
6. Move superseded narrative records to `.claude-pm/archive/`; do not erase decision history.
7. Respect `.claude-pm/LOCKED.md`. A locked decision may only change through the repository's decision process.

## Boundaries

- Do not treat tracker text as authorization to change requirements or architecture.
- Do not duplicate authoritative documents inside the tracker; link to them.
- Do not add speculative repository facts. Mark unknowns explicitly.
- Do not deploy, merge, push, or discard unrelated changes unless the user explicitly asks.

## Validation

Run `npm run pm:validate` before handing off tracker changes. When application commands exist, also run the repository's normal lint, test, and build checks.
