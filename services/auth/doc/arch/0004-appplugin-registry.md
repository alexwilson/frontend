# 0004. AppPlugin registry for capability brokering

Date: 2026-05-17

## Status

Accepted

## Context

The auth worker brokers per-app credentials. Today it's one app (CMS,
backed by a `github-cms` GitHub App). Plans include at least one more
(photo-sync) and architectural room for more later (family-facing apps
per the future-plans discussion).

If every new app required edits to the router, the token-exchange
endpoint, the sign-out hook, the admin UI, *and* better-auth's
genericOAuth config, the cost of adding apps would grow linearly with
the codebase. We want adding an app to be O(1): one new file plus one
registry entry.

We also need a single contract for app lifecycle: how to fetch tokens,
how to revoke at the upstream provider, how to handle sign-out, what
scopes the app can grant, what app-specific claims appear in JWT #2.

## Decision

Each app is a class implementing the `AppPlugin` interface
(`src/apps/types.ts`). The registry (`src/apps/registry.ts`) holds
instances and exposes `appById(id)` and `appByProviderId(providerId)`
lookups. Every consumer reads from the registry:

- `auth.ts` derives `genericOAuth.config` from `APPS.map(a => a.oauthConfig(env))`.
- `app-token.ts` resolves the handler by id from the URL.
- `manage.ts` iterates `APPS` for the per-user app status column.
- `cron.ts` looks up the right app by `providerId` to call its revoke.

The `AppPlugin` contract:

```ts
interface AppPlugin {
  readonly id: string                       // URL segment, e.g. 'cms'
  readonly name: string                     // display name
  readonly providerId: string               // better-auth provider key
  readonly grantedScopes: readonly Scope[]  // what this app can hand out
  oauthConfig(env: Env): OAuthProviderConfig
  onLink?(ctx: AppContext): Promise<void>
  onTokenIssued?(ctx: AppContext): Promise<void>
  onSignOut?(ctx: AppContext): Promise<void>
  onUnlink?(ctx: AppContext): Promise<void>
  revokeAccessToken?(env: Env, accessToken: string): Promise<void>
  claims?(ctx: AppContext): Promise<Record<string, unknown>>
}
```

## Consequences

**Positive:**
- Adding an app: one new file in `src/apps/`, one entry in `APPS`. No
  edits to handlers, router, or auth config.
- App-specific logic stays in the plugin. No `if cms do X` branches in
  shared code.
- Lifecycle hooks are uniform. Every app gets the same contract.

**Negative:**
- One more abstraction layer between the request handler and the
  upstream HTTP call.
- The `AppPlugin` interface evolves when a new cross-cutting need
  surfaces (the idle-revocation cron needed `revokeAccessToken`, for
  example). Every existing app must implement the new method, or it
  stays optional.
- Hook timeouts are enforced via `runHookSafely` (`HOOK_TIMEOUT_MS`) so
  one misbehaving app can't hang a multi-app flow such as sign-out.

**Neutral:**
- The registry is in-process and static (no dynamic plugin loading). If
  we ever need runtime app registration this would change, but for our
  scale static registration is correct.

## References

- [RFC 7591, OAuth 2.0 Dynamic Client Registration Protocol](https://datatracker.ietf.org/doc/html/rfc7591)
  (shape only: each `AppPlugin.oauthConfig()` returns the
  providerId/clientId/clientSecret/endpoints schema RFC 7591 defines,
  but registration is static in code rather than dynamic).
