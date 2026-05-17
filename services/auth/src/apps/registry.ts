// Single source of truth for which capability apps are wired into the worker.
//
// Adding an app: write a new class under src/apps/, instantiate it here, done.
// auth.ts, app-token.ts, manage.ts, and auth.cli.ts all consume from this
// registry — no other file needs touching.
import { drizzle } from 'drizzle-orm/d1'
import { and, eq } from 'drizzle-orm'
import type { Env } from '../env'
import type { Auth } from '../auth'
import { schema, account } from '../schema'
import { CmsApp } from './cms'
import type { AppContext, AppPlugin, Db } from './types'
import { intersectScopes, scopesForRole } from '../scopes'

export const APPS: readonly AppPlugin[] = [new CmsApp()]

const BY_ID = new Map(APPS.map((a) => [a.id, a]))
const BY_PROVIDER_ID = new Map(APPS.map((a) => [a.providerId, a]))

export function appById(id: string): AppPlugin | undefined {
  return BY_ID.get(id)
}
export function appByProviderId(providerId: string): AppPlugin | undefined {
  return BY_PROVIDER_ID.get(providerId)
}

// Shared revocation primitive. Used by:
//   • Admin "Revoke token" action (manage.ts)
//   • CmsApp.onSignOut (and any future per-device sign-out path)
//   • Cron idle sweep (cron.ts uses its own row-iteration form because it
//     already has the row in hand)
// Semantics: best-effort revoke at upstream, then NULL access_token +
// last_issued_at in our DB. Refresh token is kept — legitimate returns
// transparently refresh-grant on next use.
export async function revokeAndClearAccessToken(
  db: Db,
  env: Env,
  app: AppPlugin,
  userId: string,
): Promise<void> {
  const row = await db
    .select({ accessToken: account.accessToken })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, app.providerId)))
    .get()
  if (row?.accessToken && app.revokeAccessToken) {
    try {
      await app.revokeAccessToken(env, row.accessToken)
    } catch (e) {
      // Best-effort — token dies at natural TTL even if remote revoke fails.
      console.error(`[revoke] ${app.id} user=${userId} failed:`, e)
    }
  }
  await db
    .update(account)
    .set({ accessToken: null, lastIssuedAt: null })
    .where(and(eq(account.userId, userId), eq(account.providerId, app.providerId)))
    .run()
}

// Build an AppContext from a request + an existing session. Pre-computes
// the user's available scopes for this app (intersection of app-granted
// scopes and the user's role-derived scope set) so app code never has to
// repeat the math.
export function makeAppContext(
  app: AppPlugin,
  request: Request,
  env: Env,
  auth: Auth,
  session: { user: { id: string; email: string; role?: string | null } },
): AppContext {
  return {
    request,
    env,
    auth,
    db: drizzle(env.AUTH_DB, { schema }),
    userId: session.user.id,
    userEmail: session.user.email,
    userRole: session.user.role ?? '',
    grantedScopes: intersectScopes(
      app.grantedScopes,
      scopesForRole(session.user.role),
    ),
  }
}
