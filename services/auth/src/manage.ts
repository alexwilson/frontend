// Server-rendered admin UI at /auth/manage. Same-origin forms, classic POST →
// 303 redirect. No client framework. Better-auth's admin plugin owns
// /auth/admin/* for its own API surface — we live at /auth/manage to avoid that.
//
// All actions go through better-auth's server API (auth.api.*), which enforces
// role='admin' under the hood. Our own requireAdmin is defence-in-depth +
// gives us a nice 401 → sign-in redirect for unauthenticated browsers.
import { drizzle } from 'drizzle-orm/d1'
import { and, asc, desc, eq } from 'drizzle-orm'
import type { Env } from './env'
import type { Auth } from './auth'
import { appById } from './apps/registry'
import { schema, user, account, allowedEmail } from './schema'

// Capability app for the "Unlink" button on the user list. If/when the admin
// UI grows to manage multiple capabilities, this becomes a per-row dropdown.
const CMS_PROVIDER_ID = appById('cms')!.providerId

const dbFor = (env: Env) => drizzle(env.AUTH_DB, { schema })

const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!),
  )

interface AdminUser {
  id: string
  email: string
  name?: string
  role?: string
  banned?: boolean
  banReason?: string | null
}

async function requireAdmin(
  request: Request,
  auth: Auth,
): Promise<{ user: AdminUser } | Response> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/auth/manage/sign-in' },
    })
  }
  if (session.user.role !== 'admin') {
    return new Response('Forbidden — admin role required', { status: 403 })
  }
  return { user: session.user as AdminUser }
}

// Server-side trigger for the GitHub OAuth flow. Calls better-auth's signIn
// API and propagates its Set-Cookie headers onto a 302 to the GitHub authorize
// URL. The Set-Cookie carries the OAuth state — dropping it produces
// state_mismatch on the callback.
export async function handleManageSignIn(
  request: Request,
  _env: Env,
  auth: Auth,
): Promise<Response> {
  try {
    const apiResponse = (await auth.api.signInSocial({
      body: { provider: 'github', callbackURL: '/auth/manage' },
      headers: request.headers,
      asResponse: true,
    } as Parameters<typeof auth.api.signInSocial>[0])) as unknown as Response

    // If the API already returns a redirect, pass it straight through.
    if (
      apiResponse.status >= 300 &&
      apiResponse.status < 400 &&
      apiResponse.headers.get('location')
    ) {
      return apiResponse
    }

    // Otherwise it's JSON { url }; build a 302 that keeps Set-Cookie.
    const data = (await apiResponse.json()) as { url?: string }
    if (!data.url) throw new Error('no redirect url')

    const headers = new Headers(apiResponse.headers)
    headers.set('Location', data.url)
    headers.delete('content-type')
    headers.delete('content-length')
    return new Response(null, { status: 302, headers })
  } catch (e) {
    return new Response(`Sign-in failed: ${(e as Error).message}`, { status: 500 })
  }
}

async function listUsers(env: Env): Promise<AdminUser[]> {
  // Direct DB read — simpler than paginating through admin.listUsers and we
  // already have the binding. Order: admins first, then alpha by email.
  const rows = await dbFor(env)
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
    })
    .from(user)
    .orderBy(desc(user.role), asc(user.email))
    .all()
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name ?? undefined,
    role: r.role ?? undefined,
    banned: r.banned ?? undefined,
    banReason: r.banReason ?? undefined,
  }))
}

async function userHasCmsLink(env: Env, userId: string): Promise<boolean> {
  const row = await dbFor(env)
    .select({ userId: account.userId })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, CMS_PROVIDER_ID)))
    .get()
  return !!row
}

interface AllowedEmail {
  email: string
  createdAt: string
  createdBy: string | null
}

async function listAllowedEmails(env: Env): Promise<AllowedEmail[]> {
  return dbFor(env)
    .select({
      email: allowedEmail.email,
      createdAt: allowedEmail.createdAt,
      createdBy: allowedEmail.createdBy,
    })
    .from(allowedEmail)
    .orderBy(asc(allowedEmail.email))
    .all()
}

async function allowEmail(env: Env, email: string, createdBy: string): Promise<void> {
  // ON CONFLICT DO NOTHING — idempotent. Re-adding an existing email is a no-op.
  await dbFor(env)
    .insert(allowedEmail)
    .values({
      email: email.toLowerCase(),
      createdAt: new Date().toISOString(),
      createdBy,
    })
    .onConflictDoNothing()
    .run()
}

async function revokeEmail(env: Env, email: string): Promise<void> {
  await dbFor(env)
    .delete(allowedEmail)
    .where(eq(allowedEmail.email, email.toLowerCase()))
    .run()
}

async function unlinkCms(env: Env, userId: string): Promise<void> {
  await dbFor(env)
    .delete(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, CMS_PROVIDER_ID)))
    .run()
}

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font:14px/1.5 system-ui,sans-serif;background:#f5f5f5;color:#222}
header{background:#1a1a2e;color:#fff;padding:.85rem 1.5rem;display:flex;justify-content:space-between;align-items:center}
header strong{font-size:1rem}
main{max-width:1100px;margin:1.5rem auto;padding:0 1rem}
h2{font-size:.95rem;margin-bottom:.75rem;font-weight:600}
table{width:100%;background:#fff;border-collapse:collapse;box-shadow:0 1px 3px rgba(0,0,0,.08);border-radius:6px;overflow:hidden}
th,td{padding:.6rem .75rem;text-align:left;border-bottom:1px solid #eee;vertical-align:middle;font-size:.85rem}
th{background:#fafafa;font-weight:600;color:#555;font-size:.78rem;text-transform:uppercase;letter-spacing:.05em}
tr:last-child td{border-bottom:none}
code{font-family:ui-monospace,monospace;font-size:.78rem;color:#666}
.actions{display:flex;gap:.35rem;flex-wrap:wrap}
.btn{display:inline-block;padding:.3rem .55rem;border:none;border-radius:4px;cursor:pointer;font-size:.78rem;background:#e5e7eb;color:#333}
.btn-primary{background:#2563eb;color:#fff}
.btn-danger{background:#dc2626;color:#fff}
.btn-warn{background:#d97706;color:#fff}
form.inline{display:inline}
select,input[type=text]{padding:.25rem .4rem;border:1px solid #d1d5db;border-radius:4px;font-size:.82rem}
.banned{background:#fef2f2}
.banned td:first-child::before{content:"banned ";color:#dc2626;font-weight:600}
.flash{margin-bottom:1rem;padding:.6rem .85rem;border-radius:4px;font-size:.85rem}
.flash-ok{background:#d1fae5;color:#065f46}
.flash-err{background:#fee2e2;color:#991b1b}
.muted{color:#888;font-size:.8rem}
`

function page(opts: {
  me: AdminUser
  body: string
  flash?: { kind: 'ok' | 'err'; text: string }
}): string {
  const { me, body, flash } = opts
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>auth · manage</title>
<style>${CSS}</style>
</head><body>
<header>
  <strong>auth · manage</strong>
  <span class="muted">${esc(me.email)}</span>
</header>
<main>
${flash ? `<div class="flash flash-${flash.kind}">${esc(flash.text)}</div>` : ''}
${body}
</main>
</body></html>`
}

const ROLES = ['user', 'cms-editor', 'admin'] as const

function userRow(u: AdminUser, hasCms: boolean): string {
  const cls = u.banned ? 'banned' : ''
  return `<tr class="${cls}">
    <td>
      <div><strong>${esc(u.email)}</strong></div>
      ${u.name ? `<div class="muted">${esc(u.name)}</div>` : ''}
      <code>${esc(u.id)}</code>
    </td>
    <td>
      <form method="post" action="/auth/manage" class="inline">
        <input type="hidden" name="_action" value="set-role"/>
        <input type="hidden" name="userId" value="${esc(u.id)}"/>
        <select name="role">
          ${ROLES.map((r) => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
        <button type="submit" class="btn btn-primary">Save</button>
      </form>
    </td>
    <td>
      ${hasCms
        ? `<form method="post" action="/auth/manage" class="inline" data-confirm="Unlink CMS access for ${esc(u.email)}?">
            <input type="hidden" name="_action" value="unlink-cms"/>
            <input type="hidden" name="userId" value="${esc(u.id)}"/>
            <button type="submit" class="btn btn-warn">Unlink</button>
          </form>`
        : `<span class="muted">—</span>`}
    </td>
    <td>
      <div class="actions">
        ${u.banned
          ? `<form method="post" action="/auth/manage" class="inline">
              <input type="hidden" name="_action" value="unban"/>
              <input type="hidden" name="userId" value="${esc(u.id)}"/>
              <button type="submit" class="btn">Unban</button>
            </form>`
          : `<form method="post" action="/auth/manage" class="inline" data-confirm="Ban ${esc(u.email)}?">
              <input type="hidden" name="_action" value="ban"/>
              <input type="hidden" name="userId" value="${esc(u.id)}"/>
              <button type="submit" class="btn btn-warn">Ban</button>
            </form>`}
        <form method="post" action="/auth/manage" class="inline" data-confirm="Delete ${esc(u.email)} permanently?">
          <input type="hidden" name="_action" value="delete"/>
          <input type="hidden" name="userId" value="${esc(u.id)}"/>
          <button type="submit" class="btn btn-danger">Delete</button>
        </form>
      </div>
    </td>
  </tr>`
}

function allowlistRow(a: AllowedEmail): string {
  return `<tr>
    <td><strong>${esc(a.email)}</strong></td>
    <td class="muted">${esc(a.createdAt.slice(0, 10))}${a.createdBy ? ` · by ${esc(a.createdBy)}` : ''}</td>
    <td>
      <form method="post" action="/auth/manage" class="inline" data-confirm="Revoke sign-up for ${esc(a.email)}?">
        <input type="hidden" name="_action" value="revoke-email"/>
        <input type="hidden" name="email" value="${esc(a.email)}"/>
        <button type="submit" class="btn btn-danger">Revoke</button>
      </form>
    </td>
  </tr>`
}

const CONFIRM_JS = `
document.querySelectorAll('form[data-confirm]').forEach(function(f){
  f.addEventListener('submit',function(e){
    if(!confirm(f.getAttribute('data-confirm')))e.preventDefault()
  })
})`

async function handleGet(
  request: Request,
  env: Env,
  auth: Auth,
  flash?: { kind: 'ok' | 'err'; text: string },
): Promise<Response> {
  const gate = await requireAdmin(request, auth)
  if (gate instanceof Response) return gate

  const [users, allowed] = await Promise.all([listUsers(env), listAllowedEmails(env)])
  const cmsLinks = new Map<string, boolean>()
  for (const u of users) cmsLinks.set(u.id, await userHasCmsLink(env, u.id))

  const body = `
    <h2>Allowed emails (${allowed.length})</h2>
    <p class="muted" style="margin-bottom:.75rem">
      Only emails on this list can complete sign-up. Existing users keep access regardless.
    </p>
    <table>
      <thead><tr>
        <th>Email</th><th>Added</th><th>Actions</th>
      </tr></thead>
      <tbody>${allowed.map(allowlistRow).join('') || '<tr><td colspan="3" class="muted" style="text-align:center;padding:1rem">No emails allowed yet — sign-up is blocked.</td></tr>'}</tbody>
    </table>
    <form method="post" action="/auth/manage" style="margin:1rem 0 2rem">
      <input type="hidden" name="_action" value="allow-email"/>
      <input type="email" name="email" placeholder="email@example.com" required style="width:240px"/>
      <button type="submit" class="btn btn-primary">Allow sign-up</button>
    </form>

    <h2>Users (${users.length})</h2>
    <table>
      <thead><tr>
        <th>User</th><th>Role</th><th>CMS link</th><th>Actions</th>
      </tr></thead>
      <tbody>${users.map((u) => userRow(u, cmsLinks.get(u.id) ?? false)).join('')}</tbody>
    </table>
    <script>${CONFIRM_JS}</script>
  `
  return new Response(page({ me: gate.user, body, flash }), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'private, no-store',
    },
  })
}

async function handlePost(
  request: Request,
  env: Env,
  auth: Auth,
): Promise<Response> {
  // CSRF defence: reject POSTs whose Origin doesn't match BASE_URL. The
  // session cookie is SameSite=Lax + Domain=alexwilson.tech, so a malicious
  // page on a *takenover subdomain* of alexwilson.tech could otherwise forge
  // admin actions (cookie sent, session valid, role passes). Browsers reliably
  // attach Origin to POST requests; missing Origin from a real browser POST
  // is also suspicious and rejected.
  const origin = request.headers.get('Origin')
  if (!origin || origin !== env.BASE_URL) {
    return new Response('Forbidden — bad origin', { status: 403 })
  }

  const gate = await requireAdmin(request, auth)
  if (gate instanceof Response) return gate

  const form = await request.formData()
  const action = String(form.get('_action') ?? '')

  // Allowlist actions operate on emails (not user ids) and run before the
  // userId check below.
  if (action === 'allow-email' || action === 'revoke-email') {
    const email = String(form.get('email') ?? '').trim()
    if (!email) return handleGet(request, env, auth, { kind: 'err', text: 'Missing email' })
    try {
      if (action === 'allow-email') await allowEmail(env, email, gate.user.email)
      else await revokeEmail(env, email)
    } catch (e) {
      return handleGet(request, env, auth, { kind: 'err', text: `Failed: ${(e as Error).message}` })
    }
    return new Response(null, { status: 303, headers: { Location: '/auth/manage' } })
  }

  const userId = String(form.get('userId') ?? '')
  if (!userId) return handleGet(request, env, auth, { kind: 'err', text: 'Missing user' })

  // Don't allow operating on yourself for destructive actions — easy
  // foot-gun otherwise (lock yourself out, delete your own row).
  const destructive = ['ban', 'delete'].includes(action)
  if (destructive && userId === gate.user.id) {
    return handleGet(request, env, auth, { kind: 'err', text: "Can't apply that action to yourself" })
  }

  try {
    switch (action) {
      case 'set-role': {
        const role = String(form.get('role') ?? '')
        if (!ROLES.includes(role as typeof ROLES[number])) throw new Error('invalid role')
        // setRole's body type only knows the admin plugin's default roles
        // ('user' | 'admin'); we widen here because our app registry adds more.
        await auth.api.setRole({
          body: { userId, role: role as 'user' | 'admin' },
          headers: request.headers,
        })
        break
      }
      case 'ban':
        await auth.api.banUser({ body: { userId }, headers: request.headers })
        break
      case 'unban':
        await auth.api.unbanUser({ body: { userId }, headers: request.headers })
        break
      case 'delete':
        await auth.api.removeUser({ body: { userId }, headers: request.headers })
        break
      case 'unlink-cms':
        await unlinkCms(env, userId)
        break
      default:
        throw new Error('unknown action')
    }
  } catch (e) {
    return handleGet(request, env, auth, { kind: 'err', text: `Failed: ${(e as Error).message}` })
  }

  // PRG — POST then redirect so refresh doesn't re-submit
  return new Response(null, { status: 303, headers: { Location: '/auth/manage' } })
}

export async function handleManage(
  request: Request,
  env: Env,
  auth: Auth,
): Promise<Response> {
  if (request.method === 'POST') return handlePost(request, env, auth)
  return handleGet(request, env, auth)
}
