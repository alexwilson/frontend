# 0012. Domain layer for all DB access

Date: 2026-05-17

## Status

Accepted

## Context

The auth service has multiple call sites that need to read and write
the same tables:

- HTTP handlers (token broker, admin UI, manage actions).
- The scheduled cron handler.
- App lifecycle hooks (`onSignOut`, `onUnlink`) implemented by each
  `AppPlugin`.
- Better-auth database hooks (`databaseHooks.user.create.before` for
  the allowlist gate, `session.create.before` for CF geo capture).

Without a clear ownership boundary for DB access:

- The same logical operation gets implemented inconsistently across
  callers. "Revoke a token" might be a DELETE on the account row in
  one path and an UPDATE-to-NULL in another. Both clear the token,
  but the observable consequences differ (refresh-grant on return
  works in one case, not the other).
- New operations have no obvious home. Query logic accretes in
  whichever handler needed it first, and the next handler either
  reaches across or duplicates.
- Tests are coupled to the real DB driver. Anything that touches
  data needs Cloudflare-runtime emulation, which raises the cost of
  writing fast unit tests for domain logic.

We want one place per concern, with a boundary that's mechanically
enforceable.

## Decision

All DB access goes through `src/domain/` modules. The rule is
mechanically enforceable:

> Handlers (`src/manage.ts`, `src/app-token.ts`, `src/cron.ts`,
> `src/index.ts`) and apps (`src/apps/*`) never `import` from
> `drizzle-orm`. Only `src/domain/*` and `src/schema.ts` do.

`grep -l "from 'drizzle-orm" src/**/*.ts` should return only files
under `src/domain/` plus `src/schema.ts` (the schema definition
itself) and `src/auth.ts` (better-auth's drizzleAdapter, which is
its required adapter pattern).

Domain modules:

- `src/domain/db.ts`: `Db` type alias and `dbFor(env)` factory. The
  one place that knows we're on D1.
- `src/domain/users.ts`: `list(db)`.
- `src/domain/sessions.ts`: `listStats`, `listAllByUser`,
  `getActive`, `revoke`.
- `src/domain/accounts.ts`: `listAllByUser`, `listIdle`,
  `markIssued`, `revokeAndClear`, `clearByRowId`, `unlink`, plus
  the idle threshold constant.
- `src/domain/allowlist.ts`: `list`, `isAllowed`, `allow`, `revoke`
  (NFKC normalisation built in, see
  [ADR 0011](./0011-email-allowlist-nfkc.md)).

Each function takes `db: Db` (and `env: Env` only when needed for
upstream HTTP). Handlers create `db` once per request via
`dbFor(c.env)`.

## Consequences

**Positive:**
- Single source of truth for every operation. "Revoke a token" lives
  in one place (`accounts.revokeAndClear`); all three callers (admin
  UI, app onSignOut hook, cron) use it. The DELETE-vs-NULL bug can't
  reoccur.
- Handlers stay thin: parse input, call domain, render. Easy to read.
- Tests bypass D1 entirely. The same domain functions work against a
  better-sqlite3-backed drizzle handle (cast through `unknown`); a
  small schema-introspection helper builds tables from `src/schema.ts`
  with no migration files. 47 domain tests today, all in-process.
- New operations have an obvious home. "List sessions per user" goes
  in `sessions.ts`. No bikeshedding.
- A future BFF or admin SPA can add new query endpoints without
  touching any existing handler. They call the same domain functions.

**Negative:**
- More files (~5 domain modules instead of inline queries in 5
  handlers).
- Crossing the boundary requires the `dbFor(env)` step in every
  handler. Mechanical, but a small ceremony.
- Domain functions that genuinely need both DB and env (e.g.,
  `accounts.revokeAndClear` queries the DB *and* calls
  `app.revokeAccessToken(env, token)`) end up with two parameters.
  Acceptable cost.

**Neutral:**
- App lifecycle hooks (`onSignOut`, `onUnlink`) used to have direct
  `ctx.db` access. We removed `db` from `AppContext` to enforce the
  rule for apps too. Apps now call domain functions like everyone
  else.
- `apps/registry.ts` did instantiate `drizzle` to build `AppContext`
  for the (now removed) `ctx.db` field. After the cleanup, `apps/`
  has no drizzle imports.

## References

- [ADR 0002](./0002-drizzle-orm-with-cloudflare-d1.md), Drizzle + D1 (the storage layer we're abstracting)
- `services/auth/src/__tests__/test-db.ts`, schema-direct test DB factory
