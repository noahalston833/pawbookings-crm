# 0004: Application-layer tenant isolation instead of database-specific RLS

## Status

Accepted

## Context

PostgreSQL supports row-level security (RLS) policies that can enforce
tenant scoping at the database layer, so that even a buggy or
forgotten `WHERE` clause can't leak another tenant's rows. It's a real
technique, but it's Postgres-specific (no equivalent exists in MySQL),
and the project must remain able to run on MySQL later (see the README
section on switching databases). RLS policies also live outside
application source control's normal review path (in migrations as raw
SQL, not as Ruby that a Rails developer reading `app/` would
necessarily see) and typically require a second, restricted database
role plus careful `SET ROLE`/session-variable plumbing through
Rails' connection pool — real complexity to take on correctly.

## Decision

Enforce tenant isolation entirely in the application layer:

- A single shared tenant-resolution step (see docs/tenancy.md) that
  must succeed before any tenant-scoped controller action runs.
- Pundit policy scopes that filter every list/show query by
  `Current.business`.
- Composite unique indexes and foreign keys that include `business_id`
  at the database level (this part *is* portable to MySQL) to make
  cross-tenant duplicate/constraint violations impossible, even though
  read isolation itself is an application-level guarantee.

## Consequences

- Isolation is testable with ordinary request specs (log in as a
  Business A user, request a Business B resource, assert `404`) rather
  than requiring a Postgres-specific test harness.
- The guarantee depends on every controller/service/job actually going
  through the shared scoping path — this is why cross-tenant isolation
  has its own dedicated test suite (see docs/testing.md) instead of
  being treated as "obviously true because RLS handles it."
- If this project's scale ever demanded defense-in-depth beyond
  application-layer checks, adding RLS later is possible without
  changing the application code that already scopes correctly — it
  would be a second layer, not a replacement for this one.
