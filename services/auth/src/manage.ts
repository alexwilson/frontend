// Controller for /auth/manage — auth gate, request parsing, dispatch to
// domain or auth.api, then hand off to views/.
//
// No HTML in this file. All rendering lives in src/views/. All DB access
// goes through src/domain/. The controller orchestrates: read input →
// call domain or auth.api → render view → return Response.
import type { Context } from 'hono'
import type { Env } from './env'
import type { Auth } from './auth'
import { APPS, appById } from './apps/registry'
import type { AdminUser } from './domain/users'
import { dbFor } from './domain/db'
import * as users from './domain/users'
import * as sessionsDomain from './domain/sessions'
import * as accounts from './domain/accounts'
import * as allowlist from './domain/allowlist'
import { renderManagePage } from './views/manage'

type Ctx = Context<{ Bindings: Env }>

const ROLES = ['user', 'cms-editor', 'admin'] as const

// ─── Auth ────────────────────────────────────────────────────────────────

interface AdminGate {
  user: AdminUser
  sessionId: string
}

async function requireAdmin(c: Ctx, auth: Auth): Promise<AdminGate | Response> {
  const fullSession = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!fullSession?.user) return c.redirect('/auth/manage/sign-in', 302)
  if (fullSession.user.role !== 'admin') return c.text('Forbidden — admin role required', 403)
  return {
    user: fullSession.user as AdminUser,
    sessionId: fullSession.session.id,
  }
}

export async function handleManageSignIn(c: Ctx, auth: Auth): Promise<Response> {
  try {
    const apiResponse = (await auth.api.signInSocial({
      body: { provider: 'github', callbackURL: '/auth/manage' },
      headers: c.req.raw.headers,
      asResponse: true,
    } as Parameters<typeof auth.api.signInSocial>[0])) as unknown as Response

    if (
      apiResponse.status >= 300 &&
      apiResponse.status < 400 &&
      apiResponse.headers.get('location')
    ) {
      return apiResponse
    }

    const data = (await apiResponse.json()) as { url?: string }
    if (!data.url) throw new Error('no redirect url')

    const headers = new Headers(apiResponse.headers)
    headers.set('Location', data.url)
    headers.delete('content-type')
    headers.delete('content-length')
    return new Response(null, { status: 302, headers })
  } catch (e) {
    return c.text(`Sign-in failed: ${(e as Error).message}`, 500)
  }
}

// ─── Pages ───────────────────────────────────────────────────────────────

async function renderManage(
  c: Ctx,
  auth: Auth,
  flash?: { kind: 'ok' | 'err'; text: string },
): Promise<Response> {
  const gate = await requireAdmin(c, auth)
  if (gate instanceof Response) return gate

  const db = dbFor(c.env)
  const [userList, allowedEmails, accountsByUser, sessionsByUser] = await Promise.all([
    users.list(db),
    allowlist.list(db),
    accounts.listAllByUser(db),
    sessionsDomain.listAllByUser(db),
  ])

  const html = renderManagePage({
    me: gate.user,
    currentSessionId: gate.sessionId,
    users: userList,
    allowlist: allowedEmails,
    apps: APPS,
    accountsByUser,
    sessionsByUser,
    flash,
  })

  c.header('cache-control', 'private, no-store')
  return c.html(html)
}

async function handlePost(c: Ctx, auth: Auth): Promise<Response> {
  // CSRF defence: reject POSTs whose Origin doesn't match BASE_URL.
  const origin = c.req.header('Origin')
  if (!origin || origin !== c.env.BASE_URL) {
    return c.text('Forbidden — bad origin', 403)
  }

  const gate = await requireAdmin(c, auth)
  if (gate instanceof Response) return gate

  const form = await c.req.parseBody()
  const action = String(form._action ?? '')
  const db = dbFor(c.env)

  // Allowlist actions: domain layer handles normalization + mixed-script
  // rejection, returns a structured result we can flash.
  if (action === 'allow-email' || action === 'revoke-email') {
    const raw = String(form.email ?? '')
    const result = action === 'allow-email'
      ? await allowlist.allow(db, raw, gate.user.email)
      : await allowlist.revoke(db, raw)
    if (!result.ok) return renderManage(c, auth, { kind: 'err', text: result.error })
    return c.redirect('/auth/manage', 303)
  }

  // Per-session sign-out — keyed by session.id rather than session.token, so
  // we use the domain function rather than auth.api.revokeUserSession (which
  // takes the bearer token; we don't want to round-trip it through form HTML).
  if (action === 'sign-out-session') {
    const sessionId = String(form.sessionId ?? '')
    if (!sessionId) return renderManage(c, auth, { kind: 'err', text: 'Missing sessionId' })
    if (sessionId === gate.sessionId) {
      return renderManage(c, auth, { kind: 'err', text: "Can't sign out the device you're using to manage." })
    }
    try {
      await sessionsDomain.revoke(db, sessionId)
    } catch (e) {
      return renderManage(c, auth, { kind: 'err', text: `Failed: ${(e as Error).message}` })
    }
    return c.redirect('/auth/manage', 303)
  }

  const userId = String(form.userId ?? '')
  if (!userId) return renderManage(c, auth, { kind: 'err', text: 'Missing user' })

  // Foot-gun guard for actions that would lock the admin out or remove
  // their own row. 'sign-out-everywhere' included because doing it to
  // yourself kicks you off the device you're currently using.
  const destructive = ['ban', 'delete', 'sign-out-everywhere'].includes(action)
  if (destructive && userId === gate.user.id) {
    return renderManage(c, auth, { kind: 'err', text: "Can't apply that action to yourself" })
  }

  try {
    switch (action) {
      case 'set-role': {
        const role = String(form.role ?? '')
        if (!ROLES.includes(role as typeof ROLES[number])) throw new Error('invalid role')
        await auth.api.setRole({
          body: { userId, role: role as 'user' | 'admin' },
          headers: c.req.raw.headers,
        })
        break
      }
      case 'ban':
        await auth.api.banUser({ body: { userId }, headers: c.req.raw.headers })
        break
      case 'unban':
        await auth.api.unbanUser({ body: { userId }, headers: c.req.raw.headers })
        break
      case 'delete':
        await auth.api.removeUser({ body: { userId }, headers: c.req.raw.headers })
        break
      case 'unlink-app': {
        const app = appById(String(form.appId ?? ''))
        if (!app) throw new Error('unknown app')
        await accounts.unlink(db, userId, app.providerId)
        break
      }
      case 'revoke-app-token': {
        const app = appById(String(form.appId ?? ''))
        if (!app) throw new Error('unknown app')
        await accounts.revokeAndClear(db, c.env, app, userId)
        break
      }
      case 'sign-out-everywhere':
        // Better-auth's admin plugin owns this — it deletes every session row
        // for the user and runs its own permission re-check. Equivalent to
        // a bulk domain DELETE but idiomatic + free admin gate.
        await auth.api.revokeUserSessions({
          body: { userId },
          headers: c.req.raw.headers,
        })
        break
      default:
        throw new Error('unknown action')
    }
  } catch (e) {
    return renderManage(c, auth, { kind: 'err', text: `Failed: ${(e as Error).message}` })
  }

  return c.redirect('/auth/manage', 303)
}

export async function handleManage(c: Ctx, auth: Auth): Promise<Response> {
  if (c.req.method === 'POST') return handlePost(c, auth)
  return renderManage(c, auth)
}
