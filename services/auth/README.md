# auth

Cloudflare Worker providing identity and capability brokering for personal apps on `alexwilson.tech`. Built on [better-auth](https://better-auth.com) with Cloudflare D1 as the session store.

## Architecture

Two layers, deliberately separated:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │  Identity layer                                                        │
 │  One GitHub App ("identity App") with scope: user:email                │
 │  → produces a better-auth session cookie (__Secure-auth.session,       │
 │    path=/auth/) consumed by every SPA on the domain via                │
 │    /auth/get-session.                                                  │
 │  → does NOT grant access to any repository                             │
 └────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │  Capability layer (per-app, opt-in, scope-gated)                       │
 │  Each app that needs an upstream credential registers a separate       │
 │  GitHub App + an AppPlugin class. Users opt in once per capability     │
 │  via a lazy "link account" flow. The token-exchange endpoint family    │
 │  brokers fresh credentials.                                            │
 │                                                                        │
 │    /auth/app/cms/token     → JWT #2 carrying ghu_* from "CMS App"      │
 │    /auth/app/photo/token   → JWT #2 from "Photo App"  (future)         │
 │    (one endpoint family per app id; lookup via src/apps/registry.ts)   │
 └────────────────────────────────────────────────────────────────────────┘
```

**Sign-in never grants capability.** A user who has signed in (identity App) has no GitHub credential that touches repositories. The CMS App is linked lazily — only on the first call to `/auth/app/cms/token`. Other apps on the domain can identify the same user via `/auth/get-session` without ever triggering a capability link.

### Two JWTs per app

The capability endpoint family uses a **token-exchange** shape:

- **JWT #1 — identity assertion** for one app. HttpOnly cookie at `Path=/auth/app/<id>/`, name `auth.id` (with `__Secure-` prefix on https). Short-lived (15m). Caches the session lookup so subsequent calls skip the DB round-trip and re-verify statelessly via JWKS.
- **JWT #2 — capability/access**. Returned in the response body as `{ jwt: "..." }`. Carries identity claims + intersected `scope` + the upstream `access_token`. The SPA decodes it to extract whatever it needs.

Both JWTs are signed by the same JWKS (managed by better-auth's `jwt` plugin, exposed at `/auth/jwks`). Type-confusion is prevented by the `typ` claim (`identity` vs `access`); cross-app confusion by the `app` claim.

### Scope-based authorization

Roles in the admin UI (`admin`, `cms-editor`, `user`) are the human-facing assignment surface, but every authorization decision at runtime is scope-based. Roles map to scope sets via `src/scopes.ts`. At runtime, the exchange handler computes:

```
final_scope = (requested) ∩ (app.grantedScopes) ∩ (scopesForRole(user.role))
```

so an app can never hand out a scope it doesn't own, and a user can never receive a scope their role doesn't carry. Final scope (space-delimited per RFC 6749 §3.3) is published as the `scope` claim in JWT #2.

## Flows

### Sign-in (any SPA)

```mermaid
sequenceDiagram
    actor User
    participant SPA as SPA (browser)
    participant Worker as Auth worker
    participant GH as GitHub (Identity App)

    User->>SPA: Click "Sign in"
    SPA->>Worker: GET /auth/sign-in/social?provider=github
    Worker-->>SPA: 302 → GitHub authorize (PKCE S256, state)
    SPA->>GH: Authorize
    User->>GH: Grants user:email
    GH-->>SPA: 302 → /auth/callback/github (code, state)
    SPA->>Worker: GET /auth/callback/github
    Worker->>GH: Exchange code (PKCE verifier)
    GH-->>Worker: access_token (discarded after /user lookup)
    Worker->>Worker: Upsert user, sign session
    Worker-->>SPA: 302 → app, Set-Cookie __Secure-auth.session (Path=/auth/)
```

### CMS capability — lazy link on first access

```mermaid
sequenceDiagram
    participant CMS as CMS (Decap)
    participant Worker as Auth worker
    participant GH as GitHub (CMS App)

    CMS->>Worker: GET /auth/app/cms/token (Cookie: __Secure-auth.session)
    Worker->>Worker: Resolve identity (session lookup), compute available scopes
    Worker->>Worker: Look up account row, providerId='github-cms'
    alt Account not linked
        Worker-->>CMS: 401 {needsLink, provider: 'github-cms'}
        CMS->>Worker: POST /auth/oauth2/link (provider, callbackURL)
        Worker-->>CMS: 302 → GitHub authorize (CMS App)
        CMS->>GH: Authorize CMS App
        User->>GH: Grants installation access
        GH-->>CMS: 302 → /auth/oauth2/callback/github-cms
        CMS->>Worker: GET /auth/oauth2/callback/github-cms (code, state)
        Worker->>GH: Exchange code, store ghu_* + refresh
        Worker-->>CMS: 302 → original CMS URL
        CMS->>Worker: GET /auth/app/cms/token (retry)
    end
    Worker->>Worker: getAccessToken(providerId='github-cms') — refresh if stale
    Worker->>Worker: Mint JWT #1 (identity) + JWT #2 (access)
    Worker-->>CMS: 200 { jwt: <JWT#2> }, Set-Cookie __Secure-auth.id (Path=/auth/app/cms/)
    CMS->>GH: Commit via GitHub API with access_token from JWT #2
```

### CMS capability — subsequent calls (warm)

```mermaid
sequenceDiagram
    participant CMS as CMS (Decap)
    participant Worker as Auth worker
    participant GH as GitHub (CMS App)

    CMS->>Worker: GET /auth/app/cms/token (Cookie: __Secure-auth.session, __Secure-auth.id)
    Worker->>Worker: Verify JWT #1 (statelessly via JWKS — no DB read)
    alt access token within expiry
        Worker-->>CMS: 200 { jwt: <JWT#2 with cached access_token> }
    else access token expired
        Worker->>GH: POST /login/oauth/access_token (refresh_token grant)
        GH-->>Worker: new access + refresh
        Worker->>Worker: Persist rotated tokens
        Worker-->>CMS: 200 { jwt: <JWT#2 with new access_token> }
    end
```

Refresh tokens last 6 months; access tokens 8 hours. JWT #1 + JWT #2 both 15 minutes — the SPA silently refreshes by re-hitting the endpoint, which slides the JWT #1 cookie forward each time.

## Adding another app

Pattern: an SPA that needs a GitHub (or other) credential of its own. Most apps only need identity and don't need an app entry at all.

1. **Register the upstream app.** A new GitHub App (or OAuth client) for whatever resource the SPA needs. Install it on only the repos/scopes it needs. Generate client id + secret.
2. **Add env vars.** Declare the secrets in `Env` (`src/env.ts`) and supply them via `wrangler secret put` / `.dev.vars` (e.g. `GITHUB_PHOTO_CLIENT_ID`, `GITHUB_PHOTO_CLIENT_SECRET`).
3. **Add scopes.** Extend `SCOPES` in `src/scopes.ts` with the verbs your app cares about (e.g. `photo:read`, `photo:write`). Map them to roles in `ROLE_SCOPES`.
4. **Write the AppPlugin.** A new class under `src/apps/` implementing `AppPlugin` (`src/apps/types.ts`). Mirror `src/apps/cms.ts`: `id`, `providerId`, `grantedScopes`, `oauthConfig`, optional lifecycle hooks (`onLink`, `onSignOut`, etc.).
5. **Register.** Add an instance to the `APPS` array in `src/apps/registry.ts`.

No new endpoint, no router change. `auth.ts` derives the `genericOAuth` provider list from the registry; `app-token.ts` dispatches by URL pattern against the same registry; sign-out invokes `onSignOut` on every app. The consumer SPA calls `/auth/app/<your-id>/token`; existing apps are unaffected.

For SPAs that only need identity, no auth changes are needed beyond adding the SPA's origin to `TRUSTED_ORIGINS`.

## Routes

Better-auth owns `/auth/*` and exposes the standard endpoints (sign-in, callback, session, jwks, admin plugin endpoints, etc.). Our additions:

| Route | Method | Purpose |
|---|---|---|
| `/auth/app/<id>/token` | GET, POST | Token exchange for the named app. Returns `{ jwt: "..." }` (JWT #2) on success. Sets the `auth.id` cookie at `Path=/auth/app/<id>/`. 401 `{ needsLink, provider }` if the user hasn't linked the underlying account yet. 403 if no scope overlap. |
| `/auth/manage` | GET, POST | Server-rendered admin UI. Role-gated to `admin`. Manages users, roles, bans, CMS-link revocation, allowlist. |
| `/auth/sign-out` | POST | Intercepted to run each app's `onSignOut` hook (upstream revocation) and clear all per-app JWT #1 cookies before clearing the session. |
| `/auth/jwks` | GET | Owned by better-auth's `jwt` plugin — public keys for verifying any JWT we issue. |
| `/auth/*` | various | Owned by better-auth. See [better-auth docs](https://better-auth.com/docs). |

### Requesting specific scopes

`/auth/app/<id>/token` accepts an optional `scope` parameter (space-delimited per RFC 6749 §3.3) via query string or POST body. Absent → defaults to the full intersection of (app-granted) ∩ (user role scopes).

```
GET /auth/app/cms/token?scope=cms%3Aread+cms%3Awrite
```

## Standards

| Standard | Role |
|---|---|
| [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749) — OAuth 2.0 | Authorization Code grant for identity + capability flows; Refresh Token grant for silent renewal; `scope` parameter shape (§3.3) |
| [RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636) — PKCE | S256 code challenge on every OAuth round-trip (handled by better-auth) |
| [RFC 8693](https://datatracker.ietf.org/doc/html/rfc8693) — Token Exchange (shape only) | The `/auth/app/<id>/token` endpoint follows the spirit of token exchange: caller presents a subject token (session cookie or JWT #1), receives an access token (JWT #2) intersected against requested scope. We don't implement the full RFC surface (`subject_token`, `grant_type`, etc.) — registrations are static and the exchange is one-shot. |
| [RFC 9068](https://datatracker.ietf.org/doc/html/rfc9068) — JWT Access Tokens (shape only) | JWT #2 follows the JWT-profile-for-access-tokens shape: `sub`, `aud`-equivalent (via `app` claim), `scope`, `iat`, `exp`, signed by JWKS. |
| [RFC 9700](https://datatracker.ietf.org/doc/html/rfc9700) — OAuth 2.0 Security BCP | PKCE mandatory, state CSRF binding, exact redirect URI matching |
| [RFC 6265](https://datatracker.ietf.org/doc/html/rfc6265) — HTTP Cookies | Cookie attributes: `HttpOnly`, `Secure`, `SameSite=Lax`, path-scoped per role (session vs per-app), `__Secure-` prefix on https origins |
| [RFC 6750](https://datatracker.ietf.org/doc/html/rfc6750) — Bearer Token Usage | `ghu_*` access_token wrapped in JWT #2's payload; SPA presents it to GitHub API as `Authorization: Bearer <token>` |
| [RFC 7591](https://datatracker.ietf.org/doc/html/rfc7591) — Dynamic Client Registration (shape only) | Per-app `genericOAuth` registrations follow the providerId / clientId / clientSecret / endpoints schema; registrations are static in code, not dynamic |
| [RFC 7517](https://datatracker.ietf.org/doc/html/rfc7517) — JWK Set | `/auth/jwks` exposes the public keys for verifying any JWT we issue |

## Environment

### Bindings (wrangler.toml)

| Binding | Type | Purpose |
|---|---|---|
| `AUTH_DB` | D1 | better-auth tables: `user`, `session`, `account`, `verification`, `jwks`, and our `allowed_email` |

### Variables (wrangler.toml `[vars]`)

| Variable | Purpose |
|---|---|
| `BASE_URL` | Origin where the worker is reachable (e.g. `https://alexwilson.tech`). Determines the `__Secure-` cookie prefix (https → on, http → off). |
| `COOKIE_DOMAIN` | Domain for cookies (e.g. `alexwilson.tech`) |
| `TRUSTED_ORIGINS` | Comma-separated origins permitted to call `/auth/*` (CSRF + CORS) |

### Secrets (`wrangler secret put` / `.dev.vars`)

| Secret | Purpose |
|---|---|
| `BETTER_AUTH_SECRET` | Signs session cookies + encrypts JWKS private key at rest. `openssl rand -base64 32`. |
| `GITHUB_CLIENT_ID` | Identity App client id |
| `GITHUB_CLIENT_SECRET` | Identity App client secret |
| `GITHUB_CMS_CLIENT_ID` | CMS App client id |
| `GITHUB_CMS_CLIENT_SECRET` | CMS App client secret |

### Local wrangler config

`.env` (gitignored) supplies `D1_DATABASE_ID` for wrangler's `$VAR` interpolation in `wrangler.toml`. Copy `.env.dist` to start.

## Setup

```bash
# 1. Install
pnpm install

# 2. Create D1, paste id into .env
wrangler d1 create auth-db
cp .env.dist .env  # paste the printed id

# 3. Apply migrations from ./migrations/ — both locally and remote.
pnpm db:migrate:local
pnpm db:migrate:remote

# 4. Secrets
openssl rand -base64 32 | wrangler secret put BETTER_AUTH_SECRET
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put GITHUB_CMS_CLIENT_ID
wrangler secret put GITHUB_CMS_CLIENT_SECRET

# 5. Local secrets (for `wrangler dev`)
cp .dev.vars.dist .dev.vars  # fill in the same values

# 6. Run
pnpm dev
```

### GitHub App configuration

Both Apps share the same callback shape:

| Setting | Identity App | CMS App |
|---|---|---|
| Callback URL | `https://alexwilson.tech/auth/callback/github` (+ localhost for dev) | `https://alexwilson.tech/auth/oauth2/callback/github-cms` (+ localhost for dev) |
| Expire user authorization tokens | On | On |
| Webhook | Off | Off |
| User permissions | Email addresses: Read | Email addresses: Read |
| Installation permissions | (none) | Contents: R/W; Metadata: R; Pull requests: R/W |
| Install on | (irrelevant — never installed) | `alexwilson/content` only |

## Migrations

Schema is defined in `src/schema.ts` (Drizzle ORM TypeScript). Migrations are **generated automatically** by `drizzle-kit` from schema diffs and **applied** by `wrangler d1 migrations apply`.

```
src/schema.ts                       ← source of truth for tables
drizzle.config.ts                   ← drizzle-kit config (generation only)
migrations/000N_*.sql               ← generated SQL, committed
migrations/meta/_journal.json       ← drizzle-kit's tracking, committed
migrations/meta/000N_snapshot.json  ← state snapshots for future diffs, committed
```

### Day-to-day

```bash
pnpm db:migrate:local      # apply pending migrations to the local SQLite
pnpm db:migrate:remote     # apply pending migrations to remote D1
pnpm db:migrate:list       # show which migrations have been applied remotely
```

### Adding a new migration

When you change `src/schema.ts` (add a column, rename a table, etc.):

```bash
pnpm db:generate
# → drizzle-kit diffs your TS schema against the last snapshot and writes
#   migrations/000N_<random_name>.sql containing only the DDL for the diff.
#   It also updates meta/_journal.json and writes a new snapshot file.

pnpm db:migrate:local      # try locally first
pnpm db:migrate:remote     # then apply to production
```

No hand-authoring SQL. The generated `.sql` is plain SQLite DDL — read it before applying to production, especially for destructive operations (DROP COLUMN, type changes).

### Forward-only

Both drizzle-kit and `wrangler d1 migrations apply` are forward-only — no `down`. Fix forward when needed: change the schema again and generate another migration that reverses the previous change.

### Better-auth's schema

The `user`, `session`, `account`, `verification`, `jwks` tables in `src/schema.ts` match what better-auth's runtime expects (column names, types). Better-auth's `drizzleAdapter` maps TypeScript field names to camelCase DB columns. When updating better-auth or adding plugins:

1. Check if the plugin requires new columns. Better-auth's docs list these per-plugin.
2. Add the columns to `src/schema.ts`.
3. `pnpm db:generate && pnpm db:migrate:remote`.

## Operations

### Email allowlist

Sign-up is gated on the `allowed_email` table. The `user.create.before` hook in `auth.ts` rejects any new account whose email isn't on the list. **Existing user rows are unaffected** — the gate is on creation only, so the first admin can be set up before the allowlist exists.

```bash
# Add the first allowed email so a second user can ever sign up:
wrangler d1 execute auth-db --remote \
  --command "INSERT INTO allowed_email (email, created_at) VALUES ('editor@example.com', datetime('now'))"
```

After that, the admin UI at `/auth/manage` has an "Allowed emails" section for add/revoke. Revoking an email does not delete an existing user row — it only blocks *future* re-sign-ups. To fully evict an existing user, also delete them via the admin UI.

### Promote a user

```bash
wrangler d1 execute auth-db --remote \
  --command "UPDATE user SET role='admin' WHERE email='alex@alexwilson.tech'"
# or
wrangler d1 execute auth-db --remote \
  --command "UPDATE user SET role='cms-editor' WHERE email='editor@example.com'"
```

Day-to-day user/role/ban management goes through the server-rendered admin UI at `https://alexwilson.tech/auth/manage` (role: `admin`). Bootstrap the first admin via SQL as above; everything after is point-and-click.

### Rotate the CMS App credentials

1. Generate a new client secret on the CMS App's GitHub settings page.
2. `wrangler secret put GITHUB_CMS_CLIENT_SECRET` with the new value.
3. Existing user `ghu_*` tokens continue working until they expire; new sign-ins use the new secret.

The identity App and any future capability App rotate independently — no other app is affected.

### Revoke a user's CMS access

```bash
wrangler d1 execute auth-db --remote \
  --command "DELETE FROM account WHERE provider_id='github-cms' AND user_id=(SELECT id FROM user WHERE email='evicted@example.com')"
```

Their identity session is untouched; only the CMS link is removed. Next call to `/auth/app/cms/token` returns the lazy-link prompt. Any in-flight JWT #2 they hold remains valid until its `exp` (≤15 minutes).

## What this isn't

- **Not** an OAuth 2.0 authorization server for third-party clients. There's no client registration UI, no consent screen, no per-client scopes. App registrations are static, in code.
- **Not** a general-purpose IdP. Only `alexwilson.tech` apps consume it; sharing across domains would require cross-origin sessions and is intentionally not supported.
- **Not** a credential vault. Upstream tokens (e.g. GitHub `ghu_*`) are stored only because better-auth's account model stores provider tokens; the worker wraps them in JWT #2 on request. There is no "give me the user's GitHub token from outside the SPA" API.
