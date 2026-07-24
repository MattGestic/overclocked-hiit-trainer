# Locked constraints

These constraints prevent silent process drift. They are not product or architecture decisions.

## L-001 — Authoritative-source precedence

Repository requirements, architecture documents, ADRs, test plans, deployment documentation, schemas, and contribution guidance take precedence over project-management summaries.

## L-002 — One canonical backlog

`.claude-pm/WORK_ITEMS.json` is the sole structured backlog owned by this framework. The dashboard is generated output.

## L-003 — No runtime coupling

The framework must not be imported by, served by, or required for the application runtime. It may use development-only package scripts.

## L-004 — Evidence before repository claims

Unknown repository details remain explicitly unknown until verified. Agents must not fabricate commands, paths, owners, requirements, or completion evidence.

## Changing a locked constraint

Use the repository's established decision process. If none exists, document the proposed change, rationale, impact, and user approval in an ADR or equivalent decision record first.
