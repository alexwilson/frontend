import type { Env } from './env'
import type { Auth } from './auth'
import { APPS, appById, makeAppContext } from './apps/registry'
import { runHookSafely } from './apps/types'

// Generic capability-token endpoint. Caller identifies the app via ?app=<id>;
// the registry maps that to an AppPlugin which owns role-gating, lifecycle,
// and claim production. Same shape for every app — CMS, Todo, Photo Sync, etc.
//
// Lazy linking: the underlying GitHub App is linked to the user's identity
// *only* when this endpoint is called. If the session is good and the role
// passes but no account row exists for the requested providerId, we respond
// 401 with a JSON body the client uses to start the link flow.
export async function handleAppToken(
  request: Request,
  env: Env,
  auth: Auth,
): Promise<Response> {
  const url = new URL(request.url)
  const appId = url.searchParams.get('app') ?? ''
  const app = appById(appId)
  if (!app) {
    return new Response(`Unknown app: ${appId || '(missing)'}`, { status: 400 })
  }

  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const role = session.user.role ?? ''
  if (!app.requiredRoles.includes(role)) {
    return new Response(`Forbidden — role '${role}' lacks access to '${app.id}'`, { status: 403 })
  }

  const ctx = makeAppContext(request, env, auth, session)

  try {
    const res = await auth.api.getAccessToken({
      body: { providerId: app.providerId, userId: session.user.id },
      headers: request.headers,
    })
    if (!res?.accessToken) throw new Error('no token')

    // Fire-and-forget hook + claims; failures don't block the response.
    await runHookSafely(app, 'onTokenIssued', ctx)
    const claims = (await app.claims?.(ctx).catch(() => undefined)) ?? {}

    return Response.json({
      token: res.accessToken,
      provider: 'github',
      app: app.id,
      claims,
    })
  } catch {
    // No linked account for this provider. Return metadata only; the caller
    // drives the link flow itself with a POST to /auth/oauth2/link.
    return Response.json(
      { needsLink: true, app: app.id, provider: app.providerId },
      { status: 401 },
    )
  }
}

// Intercepts /auth/sign-out to run each app's onSignOut hook before the
// session is destroyed. Hooks typically revoke external tokens (GitHub etc.)
// and clean up account rows. After hooks complete, the original request is
// forwarded to better-auth to clear the session cookie + row.
export async function handleAppSignOut(
  request: Request,
  env: Env,
  auth: Auth,
): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (session?.user) {
    const ctx = makeAppContext(request, env, auth, session)
    // Run hooks in parallel — they touch disjoint provider rows and external
    // services. Each is wrapped in runHookSafely with a timeout.
    await Promise.all(APPS.map((app) => runHookSafely(app, 'onSignOut', ctx)))
  }
  return auth.handler(request)
}
