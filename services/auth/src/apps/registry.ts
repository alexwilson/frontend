// Single source of truth for which capability apps are wired into the worker.
//
// Adding an app: write a new class under src/apps/, instantiate it here, done.
// auth.ts, app-token.ts, manage.ts, and auth.cli.ts all consume from this
// registry — no other file needs touching.
import { drizzle } from 'drizzle-orm/d1'
import type { Env } from '../env'
import type { Auth } from '../auth'
import { schema } from '../schema'
import { CmsApp } from './cms'
import type { AppContext, AppPlugin } from './types'

export const APPS: readonly AppPlugin[] = [new CmsApp()]

const BY_ID = new Map(APPS.map((a) => [a.id, a]))
const BY_PROVIDER_ID = new Map(APPS.map((a) => [a.providerId, a]))

export function appById(id: string): AppPlugin | undefined {
  return BY_ID.get(id)
}
export function appByProviderId(providerId: string): AppPlugin | undefined {
  return BY_PROVIDER_ID.get(providerId)
}

// Convenience: build an AppContext from a request + an existing session.
// Centralises Drizzle instantiation so apps never need to know about D1.
export function makeAppContext(
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
  }
}
