// Plugin contract for capability apps the worker brokers credentials for.
//
// Each app is a class implementing AppPlugin. The registry (./registry.ts)
// holds instances; handlers dispatch by id and call lifecycle methods.
//
// Inspired by Passport.js strategies and better-auth's own plugin pattern.
import type { Env } from '../env'
import type { Auth } from '../auth'
import type { Scope } from '../scopes'

// What an app sees when invoked. A request-scoped bundle — env and auth come
// from the worker boot, the rest from the live request. Notably absent: a
// `db` handle. App lifecycle hooks (onSignOut etc.) read/write through
// src/domain/, the single owner of DB access in this worker.
export interface AppContext {
  readonly request: Request
  readonly env: Env
  readonly auth: Auth
  readonly userId: string
  readonly userEmail: string
  readonly userRole: string
  /** Scopes the user holds *for this app* — already intersected with grantedScopes. */
  readonly grantedScopes: readonly string[]
}

// Better-auth's GenericOAuthConfig isn't re-exported cleanly across versions;
// describe just the fields we set. genericOAuth's `config: [...]` accepts this.
export interface OAuthProviderConfig {
  providerId: string
  clientId: string
  clientSecret: string
  authorizationUrl: string
  tokenUrl: string
  userInfoUrl?: string
  scopes?: string[]
  // Expected issuer identifier (RFC 9207). Better-auth checks ?iss on the
  // OAuth callback against this. Belt-and-suspenders against mix-up attacks
  // — the primary defence is per-provider callback paths + hardcoded
  // authorizationUrl/tokenUrl. Setting `issuer` here costs nothing today
  // (most OAuth providers don't return iss yet, so the check is a no-op),
  // but starts validating automatically if/when the provider implements
  // RFC 9207. Don't set `requireIssuerValidation: true` until the provider
  // actually sends it, or the flow will fail closed.
  issuer?: string
  getUserInfo?: (tokens: { accessToken?: string }) => Promise<{
    id: string
    name?: string
    email: string
    emailVerified: boolean
    image?: string
  } | null>
}

export interface AppPlugin {
  /** Public app id — appears in the URL as /auth/app/<id>/token. */
  readonly id: string
  /** Human-readable display name — shown in the admin UI. */
  readonly name: string
  /** Better-auth providerId — the row in the `account` table. */
  readonly providerId: string
  /**
   * Scopes this app is willing to grant. The token-exchange handler
   * intersects this with the caller's requested scope and the user's
   * role-derived scope set. An app can never hand out a scope it doesn't own.
   */
  readonly grantedScopes: readonly Scope[]

  /** Provider registration consumed by better-auth's genericOAuth plugin. */
  oauthConfig(env: Env): OAuthProviderConfig

  /** Called the first time the app's account is successfully linked. */
  onLink?(ctx: AppContext): Promise<void>
  /** Called once each time a token is brokered to a client. */
  onTokenIssued?(ctx: AppContext): Promise<void>
  /** Called during sign-out, after session is read but before it's destroyed. */
  onSignOut?(ctx: AppContext): Promise<void>
  /** Called when admin unlinks the app from a user, before the row is deleted. */
  onUnlink?(ctx: AppContext): Promise<void>

  /**
   * Revoke a single upstream access token. Called by the idle-revocation
   * cron (src/cron.ts) when this account's lastIssuedAt has been quiet for
   * longer than the idle threshold. Must NOT touch the refresh token —
   * legitimate returns refresh-grant transparently. Must be idempotent
   * (the same token may be revoked twice if the cron retries after a partial
   * failure).
   */
  revokeAccessToken?(env: Env, accessToken: string): Promise<void>

  /**
   * Optional app-specific claims merged into JWT #2's payload alongside the
   * standard identity + scope + access_token claims. Pure data — signing is
   * handled centrally so the claim set is verifiable via /auth/jwks.
   */
  claims?(ctx: AppContext): Promise<Record<string, unknown>>
}

// Guard rail: every hook invocation goes through this so one app's bug can't
// hang or break a flow that touches multiple apps.
const HOOK_TIMEOUT_MS = 5000

export async function runHookSafely(
  app: AppPlugin,
  hookName: 'onLink' | 'onSignOut' | 'onUnlink' | 'onTokenIssued',
  ctx: AppContext,
): Promise<void> {
  const hook = app[hookName]
  if (!hook) return
  try {
    const work = hook.call(app, ctx)
    await Promise.race([
      work,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`hook ${app.id}.${hookName} timed out`)), HOOK_TIMEOUT_MS),
      ),
    ])
  } catch (e) {
    // Hooks must not break the surrounding flow. Log and continue.
    console.error(`[apps] ${app.id}.${hookName} failed:`, e)
  }
}
