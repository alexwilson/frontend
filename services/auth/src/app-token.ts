// Per-app capability-token endpoint family.
//
// Routes (mounted in src/index.ts):
//   /auth/app/<id>/token      GET/POST   bootstrap + exchange
//
// Two-JWT design:
//   JWT #1 — identity assertion for one app. HttpOnly cookie scoped to
//            /auth/app/<id>/. typ='identity', short-lived (15m). Caches the
//            session lookup so subsequent calls skip *most* DB work. The
//            payload carries a `sid` (session id) claim — verifiers re-check
//            that the referenced session row still exists on every use,
//            which is how per-device sign-out / admin session-revoke evicts
//            an otherwise-valid JWT #1. One indexed PK lookup on D1.
//   JWT #2 — capability/access. Returned in the response body. Includes
//            identity + intersected scope + the upstream access_token, so the
//            calling SPA can see exactly what scopes it got and what
//            credential it's wielding.
//
// Both JWTs are signed by the same JWKS (managed by the jwt plugin) and
// verifiable via /auth/jwks. Audience-vs-type discrimination is via the
// `typ` claim ('identity' / 'access') and the `app` claim ('cms' etc.).
//
// Why bind JWT #1 to a session (Plan A) vs. fork better-auth's token store
// (Plan B/E)?  See SECURITY.md (Shared upstream token across concurrent
// sessions) and services/cms/BFF.md for the design notes.
import type { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { drizzle } from 'drizzle-orm/d1'
import { and, eq } from 'drizzle-orm'
import type { Env } from './env'
import type { Auth } from './auth'
import { APPS, makeAppContext } from './apps/registry'
import { runHookSafely, type AppPlugin } from './apps/types'
import { intersectScopes, parseScopeParam, scopesForRole } from './scopes'
import { schema, account, session } from './schema'

type Ctx = Context<{ Bindings: Env }>

// JWT #1 cookie name — same name for every app, disambiguated by path
// scoping (/auth/app/<id>/). __Secure- prefix is added in prod automatically
// based on BASE_URL scheme; localhost dev gets the bare name.
const JWT1_COOKIE_BASE = 'auth.id'
const JWT1_TTL_SECONDS = 15 * 60
const JWT2_TTL_SECONDS = 15 * 60

interface IdentityPayload extends Record<string, unknown> {
  sub: string
  email: string
  role: string
  app: string
  typ: 'identity'
  // `sid` (session id) binds the JWT to the better-auth session that
  // bootstrapped it. On verify, we look up the session row; if it's been
  // deleted (the user signed out on this device, or admin revoked it),
  // the JWT is dead even though its signature + exp would otherwise pass.
  // This is what gives us per-device revocation despite better-auth's
  // shared-upstream-token model.
  sid: string
}

interface AccessPayload extends Record<string, unknown> {
  sub: string
  email: string
  app: string
  typ: 'access'
  scope: string
  access_token: string
}

// __Secure- prefix only on https origins — Secure-prefixed cookies are
// silently dropped by browsers on http:// (incl. localhost in some configs).
function useSecurePrefix(env: Env): boolean {
  return env.BASE_URL.startsWith('https://')
}

function jwt1CookieName(env: Env): string {
  return useSecurePrefix(env) ? `__Secure-${JWT1_COOKIE_BASE}` : JWT1_COOKIE_BASE
}

function jwt1CookieOpts(env: Env, app: AppPlugin) {
  return {
    path: `/auth/app/${app.id}/`,
    // No `domain` — host-only, see auth.ts session cookie comment for why.
    httpOnly: true,
    secure: useSecurePrefix(env),
    sameSite: 'Lax' as const,
    maxAge: JWT1_TTL_SECONDS,
  }
}

// auth.api.signJWT is typed loosely — better-auth lets you put anything in
// the payload. Wrapper here just adds iat/exp.
async function signJwt(auth: Auth, payload: Record<string, unknown>, ttlSeconds: number): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const fullPayload = { ...payload, iat: now, exp: now + ttlSeconds }
  const result = (await (auth.api as { signJWT: (i: unknown) => Promise<{ token: string }> }).signJWT({
    body: { payload: fullPayload },
  })) as { token: string }
  return result.token
}

interface VerifiedIdentity {
  sub: string
  email: string
  role: string
  app: string
  sid: string
}

// Verifies a JWT #1 cookie value. Two checks beyond the signature:
//   1. Type + app claim match what this endpoint expects (prevents using a
//      JWT #2 as JWT #1, or another app's JWT #1 here).
//   2. The `sid` claim refers to a still-existing, unexpired session row.
//      This is how per-device sign-out / admin session-revoke evicts a
//      JWT #1 that would otherwise still verify cryptographically.
// Returns null on any failure — callers fall back to session-cookie bootstrap.
async function verifyIdentityJwt(
  c: Ctx,
  auth: Auth,
  token: string,
  expectedApp: string,
): Promise<VerifiedIdentity | null> {
  try {
    const result = (await (auth.api as { verifyJWT: (i: unknown) => Promise<{ payload: unknown }> }).verifyJWT({
      body: { token },
    })) as { payload: IdentityPayload | null }
    const p = result.payload
    if (!p || p.typ !== 'identity' || p.app !== expectedApp) return null
    if (typeof p.sub !== 'string' || typeof p.email !== 'string' || typeof p.sid !== 'string') return null

    // Session-row existence check — the live check that gives us per-device
    // revocation. One indexed PK lookup on D1; sub-millisecond.
    const db = drizzle(c.env.AUTH_DB, { schema })
    const sessionRow = await db
      .select({ userId: session.userId, expiresAt: session.expiresAt })
      .from(session)
      .where(eq(session.id, p.sid))
      .get()
    if (!sessionRow) return null
    if (sessionRow.userId !== p.sub) return null
    if (sessionRow.expiresAt.getTime() < Date.now()) return null

    return { sub: p.sub, email: p.email, role: p.role ?? '', app: p.app, sid: p.sid }
  } catch {
    return null
  }
}

// Looks up the user's identity for an /auth/app/<id>/token call. Prefers a
// valid JWT #1 cookie; falls back to the session cookie. Returns null if
// neither establishes identity.
async function resolveIdentity(
  c: Ctx,
  auth: Auth,
  app: AppPlugin,
): Promise<VerifiedIdentity | null> {
  const cookieToken = getCookie(c, jwt1CookieName(c.env))
  if (cookieToken) {
    const identity = await verifyIdentityJwt(c, auth, cookieToken, app.id)
    if (identity) return identity
  }
  const fullSession = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!fullSession?.user) return null
  return {
    sub: fullSession.user.id,
    email: fullSession.user.email,
    role: (fullSession.user as { role?: string }).role ?? '',
    app: app.id,
    sid: fullSession.session.id,
  }
}

// Pulls requested scopes from either query (GET) or form/JSON body (POST).
// RFC 6749 §3.3 — space-delimited list. If empty/missing, returns null
// (caller treats null as "everything I'm allowed").
async function readRequestedScope(c: Ctx): Promise<string[] | null> {
  const fromQuery = c.req.query('scope')
  if (fromQuery) return parseScopeParam(fromQuery)

  if (c.req.method === 'POST') {
    const contentType = c.req.header('content-type') ?? ''
    try {
      if (contentType.includes('application/json')) {
        const body = (await c.req.json()) as { scope?: string }
        return body.scope ? parseScopeParam(body.scope) : null
      }
      const form = await c.req.parseBody()
      const raw = form.scope
      return typeof raw === 'string' ? parseScopeParam(raw) : null
    } catch {
      return null
    }
  }
  return null
}

export async function handleAppToken(c: Ctx, auth: Auth, app: AppPlugin): Promise<Response> {
  const identity = await resolveIdentity(c, auth, app)
  if (!identity) return c.text('Unauthorized', 401)

  // Authorization: intersect (requested) ∩ (app-granted) ∩ (role-derived).
  // Empty result → 403 with a hint so the caller can show a useful error.
  const userScopes = scopesForRole(identity.role)
  const available = intersectScopes(app.grantedScopes, userScopes)
  const requested = await readRequestedScope(c)
  const finalScope = requested === null
    ? available
    : intersectScopes(requested, available)

  if (finalScope.length === 0) {
    return c.json(
      {
        error: 'insufficient_scope',
        error_description: `No scopes granted. Role '${identity.role}' has no overlap with app '${app.id}' (granted: ${app.grantedScopes.join(' ')}).`,
      },
      403,
    )
  }

  // Fetch the upstream access token. Better-auth handles refresh internally.
  // If the account isn't linked yet, this throws; surface a needsLink response
  // so the caller can drive the second-leg OAuth.
  let accessToken: string
  try {
    const res = await auth.api.getAccessToken({
      body: { providerId: app.providerId, userId: identity.sub },
      headers: c.req.raw.headers,
    })
    if (!res?.accessToken) throw new Error('no token')
    accessToken = res.accessToken
  } catch {
    return c.json({ needsLink: true, app: app.id, provider: app.providerId }, 401)
  }

  // App-specific claims merged into JWT #2's payload.
  const appCtx = makeAppContext(app, c.req.raw, c.env, auth, {
    user: { id: identity.sub, email: identity.email, role: identity.role },
  })
  await runHookSafely(app, 'onTokenIssued', appCtx)
  const extraClaims = (await app.claims?.(appCtx).catch(() => undefined)) ?? {}

  // Stamp last_issued_at so the idle-revocation cron (src/cron.ts) can tell
  // this account is in active use. Done after access-token success so we
  // don't keep alive accounts whose underlying tokens are dead.
  await appCtx.db
    .update(account)
    .set({ lastIssuedAt: new Date() })
    .where(and(eq(account.userId, identity.sub), eq(account.providerId, app.providerId)))
    .run()

  const accessPayload: AccessPayload = {
    sub: identity.sub,
    email: identity.email,
    app: app.id,
    typ: 'access',
    scope: finalScope.join(' '),
    access_token: accessToken,
    ...extraClaims,
  }
  const jwt2 = await signJwt(auth, accessPayload, JWT2_TTL_SECONDS)

  // Mint JWT #1 on every successful call. Cheap (signing only), and ensures
  // the cookie's TTL slides forward — caller doesn't decay into session
  // fallbacks while actively using the app.
  const identityPayload: IdentityPayload = {
    sub: identity.sub,
    email: identity.email,
    role: identity.role,
    app: app.id,
    typ: 'identity',
    sid: identity.sid,
  }
  const jwt1 = await signJwt(auth, identityPayload, JWT1_TTL_SECONDS)

  setCookie(c, jwt1CookieName(c.env), jwt1, jwt1CookieOpts(c.env, app))
  return c.json({ jwt: jwt2 })
}

// Intercepts /auth/sign-out. Runs each app's onSignOut hook (upstream
// revocation), then forwards to better-auth, then clears all per-app JWT #1
// cookies on the way back.
export async function handleAppSignOut(c: Ctx, auth: Auth): Promise<Response> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (session?.user) {
    for (const app of APPS) {
      const appCtx = makeAppContext(app, c.req.raw, c.env, auth, session)
      // eslint-disable-next-line no-await-in-loop
      await runHookSafely(app, 'onSignOut', appCtx)
    }
  }
  // Forward to better-auth so it clears the session cookie + row. We can't
  // use Hono's deleteCookie here because that mutates c.res, and we're
  // returning a Response from upstream — Hono's deferred cookies wouldn't
  // make it onto the wire. Set-Cookie is appendable, so we mutate downstream
  // headers directly.
  const downstream = await auth.handler(c.req.raw)
  const response = new Response(downstream.body, downstream)
  for (const app of APPS) {
    const opts = jwt1CookieOpts(c.env, app)
    const parts = [
      `${jwt1CookieName(c.env)}=`,
      `Path=${opts.path}`,
      `Max-Age=0`,
      `HttpOnly`,
      `SameSite=${opts.sameSite}`,
    ]
    if (opts.secure) parts.push('Secure')
    response.headers.append('Set-Cookie', parts.join('; '))
  }
  return response
}

// Kept for future use (e.g. an admin-driven per-app unlink that also clears
// the user's local JWT #1 cookie). Unused today but co-located so the cookie
// lifecycle stays in one file.
export function clearJwt1Cookie(c: Ctx, app: AppPlugin): void {
  deleteCookie(c, jwt1CookieName(c.env), { path: `/auth/app/${app.id}/` })
}
