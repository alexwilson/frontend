// Plugin contract for capability apps the worker brokers credentials for.
//
// Each app is a class implementing AppPlugin. The registry (./registry.ts)
// holds instances; handlers dispatch by id and call lifecycle methods.
//
// Inspired by Passport.js strategies and better-auth's own plugin pattern.
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { Env } from '../env'
import type { Auth } from '../auth'
import type { schema } from '../schema'

export type Db = DrizzleD1Database<typeof schema>

// What an app sees when invoked. A request-scoped bundle — env and auth come
// from the worker boot, the rest from the live request.
export interface AppContext {
  readonly request: Request
  readonly env: Env
  readonly auth: Auth
  readonly db: Db
  readonly userId: string
  readonly userEmail: string
  readonly userRole: string
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
  getUserInfo?: (tokens: { accessToken?: string }) => Promise<{
    id: string
    name?: string
    email: string
    emailVerified: boolean
    image?: string
  } | null>
}

export interface AppPlugin {
  /** Public app id — what callers send as ?app=. */
  readonly id: string
  /** Better-auth providerId — the row in the `account` table. */
  readonly providerId: string
  /** Role(s) permitted to obtain this app's token. */
  readonly requiredRoles: readonly string[]

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
   * Optional app-specific claims merged into the /auth/app/token response.
   * Pure data — no signing. Clients trust the auth worker; if you ever need
   * third-party verifiable claims, sign a JWT here instead.
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
