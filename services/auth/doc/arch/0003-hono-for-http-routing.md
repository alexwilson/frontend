# 0003. Hono for HTTP routing in the auth worker

Date: 2026-05-17

## Status

Accepted

## Context

The auth worker handles several endpoint families:

- Per-app capability token broker (parameterised by app id).
- Sign-out interception.
- Server-rendered admin UI.
- Error page.
- Everything else under the auth prefix delegated to better-auth's
  handler.

This wants a router with a few properties:

- **Declarative path matching.** Manual `if (pathname === ...)` chains
  tangle path matching with handler logic, and they need hand-rolled
  regex for URL params.
- **Method dispatch.** Per-route GET vs. POST handling without
  branching on `request.method` inside each handler.
- **Middleware composition.** CORS scoped to SPA-facing routes only
  (server-rendered admin paths and better-auth's admin-plugin
  endpoints shouldn't echo CORS, by design); future rate-limiting.
- **Typed env access.** Cloudflare Bindings type-checked in handlers
  rather than `any` from a raw `fetch` signature.
- **Cloudflare Workers runtime compatibility.** Express, Koa, and
  Fastify all assume Node's `http` module and don't run in the Workers
  runtime.

## Decision

We will use [Hono](https://hono.dev) (~14 KB) as the HTTP router. The
worker entry exports `app.fetch` and `app.scheduled` (for the cron
trigger).

Idioms we'll adopt:

- `app.get`/`app.post`/`app.on(['GET','POST'], ...)` for method+path dispatch.
- `:id` path params. Hono parses them; no regex in our code.
- `hono/cors` middleware, scoped to SPA-facing routes only. Admin and
  better-auth admin-plugin paths deliberately don't echo CORS (see
  threat model T12).
- `hono/cookie` (`getCookie` / `setCookie`) for cookie helpers. Custom
  serialization only where we need to merge headers with another
  `Response` (the sign-out path).
- `c.req.parseBody()`, `c.req.query(...)`, `c.req.header(...)` instead of
  reading the raw Request directly.
- `Context<{ Bindings: Env }>` type param so handler env access is typed.

## Consequences

**Positive:**
- Routing is declarative; the entry file reads as a route table.
- Method and path mismatches are caught by Hono before handler code runs.
- Middleware composition (CORS, future rate limiting) is one line per
  scope.
- Path params are typed.
- Runtime cost is negligible.

**Negative:**
- One more dependency.
- Two ways to access the request (`c.req.*` vs. `c.req.raw`). We use
  `c.req.raw` when passing through to better-auth's `auth.handler(...)`,
  which expects a plain `Request`.
- The cookie middleware (`setCookie(c, ...)`) mutates `c.res`, which is
  bypassed when we return a `Response` directly (the sign-out
  pass-through, for example). Those mixed-mode cases are mildly awkward
  and documented at the call sites.

## References

- [Hono documentation](https://hono.dev/docs)
