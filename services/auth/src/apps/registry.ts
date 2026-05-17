// Single source of truth for which capability apps are wired into the worker.
//
// Adding an app: write a new class under src/apps/, instantiate it here, done.
// auth.ts, app-token.ts, manage.ts, and auth.cli.ts all consume from this
// registry — no other file needs touching.
import type { Env } from '../env'
import type { Auth } from '../auth'
import { CmsApp } from './cms'
import type { AppContext, AppPlugin } from './types'
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
    userId: session.user.id,
    userEmail: session.user.email,
    userRole: session.user.role ?? '',
    grantedScopes: intersectScopes(
      app.grantedScopes,
      scopesForRole(session.user.role),
    ),
  }
}
