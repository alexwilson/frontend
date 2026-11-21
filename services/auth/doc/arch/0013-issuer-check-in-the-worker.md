# 0013. RFC 9207 issuer check in the worker

Date: 2026-11-21

## Status

Proposed

## Context

Capability Apps register their own OAuth provider through better-auth's
`genericOAuth` plugin (ADR 0004). Each provider sets a static `issuer`,
and better-auth compared the `iss` query parameter on the OAuth callback
against it. This is the RFC 9207 defence against mix-up attacks. GitHub
has sent `iss` on callbacks since April 2026.

better-auth 1.7 changed how generic providers work:

- They are registered as ordinary social providers. The plugin's own
  routes (`/oauth2/link`, `/sign-in/oauth2`, `/oauth2/callback/:id`) are
  gone. Linking uses `/link-social` and the callback is `/callback/:id`.
- A generic provider's issuer now comes only from OIDC discovery
  (`discoveryUrl`). The static `issuer` option no longer exists.

Our providers set the endpoints by hand and do not use discovery, so
after the upgrade better-auth has no expected issuer and skips the
check. Nothing fails: `OAuthProviderConfig` is our own loose type, so
the dropped option still typechecks.

Two ways to keep the check:

- Set `discoveryUrl`. better-auth then treats the provider as OIDC. It
  adds the `openid` scope and can require a verified ID token. That
  changes the sign-in flow for a GitHub App in ways we cannot test
  without a live round trip.
- Check `iss` ourselves before the request reaches better-auth.

## Decision

We will check `iss` in the worker. A route on
`GET /auth/callback/:providerId` looks up the app by provider id, reads
the expected issuer from its `oauthConfig`, and redirects to
`/auth/error?error=issuer_mismatch` when `iss` is present and different.
Otherwise the request continues to better-auth.

The semantics match better-auth 1.6 without `requireIssuerValidation`: a
missing or empty `iss` is allowed, a wrong one is rejected. An attacker
who controls the callback URL can leave `iss` out, so this is defence in
depth and not a full RFC 9207 implementation. The main defence is that
each provider has its own callback path and hardcoded endpoints.

Failing closed on a missing `iss` is the stronger setting. We do not do
it yet because we have not confirmed that GitHub sends `iss` on every
callback, including error callbacks, and a wrong guess locks everyone
out of the CMS.

## Consequences

- The issuer check is as strong after the upgrade as before it, and is
  now covered by our own router tests instead of library behaviour.
- better-auth answers 404 for a trailing slash, a different case and the
  old `/oauth2/callback/:id` path. It turns a POST callback into a
  redirect to the GET route with `iss` kept. So the GET route sees every
  callback that better-auth would process.
- The check is ours to maintain. If better-auth restores a static issuer
  option, this route becomes redundant and should be removed.
- The route only covers providers in the app registry. The built-in
  `github` provider is handled by better-auth, as before.
- The CMS GitHub App needs `/auth/callback/github-cms` as a callback
  URL. The old `/auth/oauth2/callback/github-cms` URL stops working.
- `getAccessToken` now takes the account row id, so the token broker
  looks the row up through the domain layer (ADR 0012) first.
- better-auth 1.7 writes `alg` and `crv` on the `jwks` table. Migration
  `0004_jwks_alg_crv` must be applied before the new worker is deployed,
  because reading signing keys fails without the columns.
