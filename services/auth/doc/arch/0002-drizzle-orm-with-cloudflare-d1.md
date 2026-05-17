# 0002. Drizzle ORM + Cloudflare D1 as the data layer

Date: 2026-05-17

## Status

Accepted

## Context

The auth worker needs persistent storage for users, sessions, account
links (per-app provider credentials), JWKS keys, and our own additions
like the email allowlist. Constraints:

- Runtime is Cloudflare Workers. D1 is the obvious SQL store; Workers KV
  isn't a fit for relational data.
- Typed queries (TypeScript end-to-end).
- Migrations. Production data exists, so ad-hoc schema changes are
  unsafe.
- An ORM that better-auth's drizzle adapter understands (see
  [ADR 0001](./0001-use-better-auth.md)).

## Decision

- **Drizzle ORM** as the typed query layer.
- **`drizzle-kit generate`** for migration generation (TS schema → SQL
  diff). Schema lives in `src/schema.ts` as the source of truth.
- **`wrangler d1 migrations apply`** for migration *application*: the
  Cloudflare-native flow that records applied migrations in D1's
  `d1_migrations` table.
- **`drizzle-orm/d1`** driver in production, **`drizzle-orm/better-sqlite3`**
  driver in tests (see [ADR 0012](./0012-domain-layer.md)'s test path).

We will not use Drizzle's `migrate` or `push`. Wrangler owns migration
state on D1, and drizzle-kit's generate-only mode avoids needing DB
credentials at generation time.

## Consequences

**Positive:**
- Type-safe queries; column renames surface as compile errors.
- Migration generation eliminates a class of bugs (forgotten DDL changes).
- Drizzle's adapter for better-auth means we don't fork its query layer.
- The same schema works against D1 (prod) and better-sqlite3 (tests),
  which enables the in-memory test pattern.

**Negative:**
- Tied to Drizzle for the lifetime of the project; swapping it would
  touch every domain module.
- Migration tracking lives in two places: drizzle-kit's snapshot
  (`meta/*.json`) for diff generation, and D1's `d1_migrations` table
  for application state. These can drift if a migration is applied
  out-of-band; recovery is documented in `services/auth/README.md`.
- drizzle-kit's auto-generated migration filenames are random words
  (`0003_living_blindfold.sql`); we rename them to descriptive forms by
  hand.

**Neutral:**
- Schema convention: SQL columns are snake_case, TS field names are
  camelCase. Drizzle bridges both via column declarations (first arg is
  the SQL name, property name is the TS name).
- Dates use `integer({ mode: 'timestamp_ms' })`: stored as INTEGER (Unix
  ms), exposed as `Date` in TS. Drizzle's TEXT type has no date mode in
  this version, and better-auth passes `Date` objects through to the
  adapter, so transparent conversion is required.

## References

- [Drizzle ORM documentation](https://orm.drizzle.team)
- [Cloudflare D1 documentation](https://developers.cloudflare.com/d1/)
