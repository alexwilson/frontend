// Server-rendered admin UI at /auth/manage. Same-origin forms, classic POST →
// 303 redirect. No client framework. Better-auth's admin plugin owns
// /auth/admin/* for its own API surface — we live at /auth/manage to avoid that.
//
// Pure presentation + thin controller. All DB access goes through src/domain/
// — handlers in this file never import drizzle directly.
//
// Styling: PicoCSS (~10KB) inlined for tables/forms/typography defaults, plus
// a small CUSTOM_CSS block for badges + inline-form layout. No external fonts
// (Pico uses system-ui).
//
// Composition: tiny template-string "component" layer (Badge / Button /
// ActionForm) — same mental model as React components, zero runtime.
import type { Context } from 'hono'
import picoCss from '@picocss/pico/css/pico.min.css'
import type { Env } from './env'
import type { Auth } from './auth'
import { appById } from './apps/registry'
import * as users from './domain/users'
import * as sessionsDomain from './domain/sessions'
import * as accounts from './domain/accounts'
import * as allowlist from './domain/allowlist'

type Ctx = Context<{ Bindings: Env }>

// Keep in sync with cron.ts; if it grows a third caller, extract to a shared
// constants module.
const IDLE_THRESHOLD_MS = 10 * 60 * 1000

// Capability app for the per-user "CMS" column + "Revoke token" / "Unlink"
// actions. When the admin UI gains a per-row app selector, this becomes a map.
const CMS_APP = appById('cms')!

const ROLES = ['user', 'cms-editor', 'admin'] as const

const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!),
  )

// ─── Components ──────────────────────────────────────────────────────────
// Typed template functions. Same authoring ergonomics as React without the
// runtime — each takes typed props and returns an HTML string.

type BadgeKind = 'active' | 'idle' | 'cleared' | 'unlinked' | 'admin' | 'banned'
const Badge = (kind: BadgeKind, text: string, hint?: string): string =>
  `<span class="badge badge-${kind}"${hint ? ` title="${esc(hint)}"` : ''}>${esc(text)}</span>`

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warn'
const Button = (variant: ButtonVariant, label: string): string =>
  `<button type="submit" class="btn btn-${variant}">${esc(label)}</button>`

// Wraps a button-form. If `confirm` is set, vanilla JS confirms before submit.
type ActionFormProps = {
  action: string
  fields: Record<string, string>
  button: string
  confirm?: string
}
const ActionForm = (p: ActionFormProps): string =>
  `<form method="post" action="/auth/manage" class="inline-form"${p.confirm ? ` data-confirm="${esc(p.confirm)}"` : ''}>
    <input type="hidden" name="_action" value="${esc(p.action)}"/>
    ${Object.entries(p.fields).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}"/>`).join('')}
    ${p.button}
  </form>`

// ─── Status helpers ──────────────────────────────────────────────────────

function formatAgo(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function cmsStatusBadge(info: accounts.AccountInfo | undefined): string {
  if (!info?.hasRow) return Badge('unlinked', 'Not linked', 'No CMS account row for this user')
  if (!info.hasToken) return Badge('cleared', 'Token cleared', 'Account linked, refresh token kept; transparently re-issues on next use')
  if (!info.lastIssuedAt) return Badge('idle', 'Idle', 'Token exists but never brokered — cron will revoke on next tick')
  const age = Date.now() - info.lastIssuedAt.getTime()
  const ago = formatAgo(age)
  if (age < IDLE_THRESHOLD_MS) {
    return Badge('active', 'Active', `Last brokered ${ago} ago`)
  }
  return Badge('idle', 'Idle', `Last brokered ${ago} ago — cron will revoke on next tick`)
}

// ─── Auth ────────────────────────────────────────────────────────────────

async function requireAdmin(
  c: Ctx,
  auth: Auth,
): Promise<{ user: users.AdminUser } | Response> {
  const fullSession = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!fullSession?.user) return c.redirect('/auth/manage/sign-in', 302)
  if (fullSession.user.role !== 'admin') return c.text('Forbidden — admin role required', 403)
  return { user: fullSession.user as users.AdminUser }
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

// ─── CSS ─────────────────────────────────────────────────────────────────
// Layers on top of Pico's tokens (--pico-*). Adds badges + inline-form
// horizontal layout (Pico defaults to vertical stacking for form elements).
// Colours hardcoded rather than reused from --pico-color-* so the semantic
// meaning is obvious at the call site (active = green, idle = amber, etc.).
const CUSTOM_CSS = `
:root { --pico-form-element-spacing-vertical: .4rem; --pico-form-element-spacing-horizontal: .6rem; }
main.container { padding-top: 1rem; padding-bottom: 2rem; }
header.app-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: .85rem 0; margin-bottom: 1rem;
  border-bottom: 1px solid var(--pico-muted-border-color);
}
article { padding: 1rem 1.25rem; margin-bottom: 1.5rem; }
article > header { padding: 0 0 .75rem; margin: 0 0 1rem; background: transparent; }
table { font-size: .9rem; margin-bottom: 0; }
table th, table td { padding: .5rem .6rem; }
.badge {
  display: inline-block; padding: 2px 8px; border-radius: 999px;
  font-size: .72rem; font-weight: 600; vertical-align: middle;
  letter-spacing: .02em;
}
.badge-active { background: #d1fae5; color: #065f46; }
.badge-idle { background: #fef3c7; color: #92400e; }
.badge-cleared { background: #e5e7eb; color: #374151; }
.badge-unlinked { background: transparent; color: var(--pico-muted-color); border: 1px dashed var(--pico-muted-border-color); }
.badge-admin { background: #dbeafe; color: #1e40af; }
.badge-banned { background: #fee2e2; color: #991b1b; }
.inline-form { display: inline-flex; gap: 4px; align-items: center; margin: 0; }
.inline-form select, .inline-form input { margin: 0; }
.btn {
  display: inline-block; padding: .35rem .7rem; border-radius: var(--pico-border-radius);
  border: 1px solid transparent; font-size: .8rem; font-weight: 500; cursor: pointer;
  background: var(--pico-secondary-background); color: var(--pico-secondary-inverse);
}
.btn-primary { background: var(--pico-primary-background); color: var(--pico-primary-inverse); }
.btn-secondary { background: transparent; border-color: var(--pico-muted-border-color); color: var(--pico-color); }
.btn-warn { background: #d97706; color: #fff; }
.btn-danger { background: #dc2626; color: #fff; }
.actions { display: flex; gap: 4px; flex-wrap: wrap; }
.muted { color: var(--pico-muted-color); font-size: .85rem; }
.flash {
  padding: .75rem 1rem; margin-bottom: 1rem;
  border-radius: var(--pico-border-radius); font-size: .9rem;
}
.flash-ok { background: #d1fae5; color: #065f46; }
.flash-err { background: #fee2e2; color: #991b1b; }
.id-code {
  font-family: var(--pico-font-family-monospace); font-size: .68rem;
  color: var(--pico-muted-color); margin-top: 2px;
}
.user-cell strong { font-weight: 600; }
`

const CONFIRM_JS = `<script>
document.querySelectorAll('form[data-confirm]').forEach(function(f){
  f.addEventListener('submit', function(e){
    if(!confirm(f.getAttribute('data-confirm'))) e.preventDefault()
  })
})
</script>`

function page(opts: {
  me: users.AdminUser
  body: string
  flash?: { kind: 'ok' | 'err'; text: string }
}): string {
  const { me, body, flash } = opts
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light dark"/>
<title>auth · manage</title>
<style>${picoCss}</style>
<style>${CUSTOM_CSS}</style>
</head><body>
<main class="container">
<header class="app-header">
  <strong>auth · manage</strong>
  <span class="muted">${esc(me.email)}</span>
</header>
${flash ? `<div class="flash flash-${flash.kind}">${esc(flash.text)}</div>` : ''}
${body}
</main>
${CONFIRM_JS}
</body></html>`
}

function userRow(
  u: users.AdminUser,
  cms: accounts.AccountInfo | undefined,
  sessions: sessionsDomain.SessionStats | undefined,
): string {
  return `<tr${u.banned ? ' style="opacity:.55"' : ''}>
    <td class="user-cell">
      <div>
        <strong>${esc(u.email)}</strong>
        ${u.role === 'admin' ? ' ' + Badge('admin', 'admin') : ''}
        ${u.banned ? ' ' + Badge('banned', 'banned') : ''}
      </div>
      ${u.name ? `<div class="muted">${esc(u.name)}</div>` : ''}
      <div class="id-code">${esc(u.id)}</div>
    </td>
    <td>
      <form method="post" action="/auth/manage" class="inline-form">
        <input type="hidden" name="_action" value="set-role"/>
        <input type="hidden" name="userId" value="${esc(u.id)}"/>
        <select name="role">
          ${ROLES.map((r) => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
        ${Button('primary', 'Save')}
      </form>
    </td>
    <td>${cmsStatusBadge(cms)}</td>
    <td>
      ${sessions && sessions.count > 0
        ? `<span title="Last seen ${sessions.lastSeen ? formatAgo(Date.now() - sessions.lastSeen.getTime()) + ' ago' : 'never'}">${sessions.count} session${sessions.count === 1 ? '' : 's'}</span>`
        : `<span class="muted">none</span>`
      }
    </td>
    <td>
      <div class="actions">
        ${cms?.hasToken
          ? ActionForm({
              action: 'revoke-token',
              fields: { userId: u.id },
              button: Button('warn', 'Revoke token'),
              confirm: `Revoke access token for ${u.email}? They'll transparently get a new one on next CMS use (refresh token kept).`,
            })
          : ''}
        ${sessions && sessions.count > 0
          ? ActionForm({
              action: 'sign-out-everywhere',
              fields: { userId: u.id },
              button: Button('warn', 'Sign out all'),
              confirm: `Sign out ${u.email} from all ${sessions.count} device${sessions.count === 1 ? '' : 's'}? They'll need to sign in again everywhere.`,
            })
          : ''}
        ${cms?.hasRow
          ? ActionForm({
              action: 'unlink-cms',
              fields: { userId: u.id },
              button: Button('warn', 'Unlink CMS'),
              confirm: `Unlink CMS for ${u.email}? They'll need to re-OAuth the GitHub App.`,
            })
          : ''}
        ${u.banned
          ? ActionForm({ action: 'unban', fields: { userId: u.id }, button: Button('secondary', 'Unban') })
          : ActionForm({
              action: 'ban',
              fields: { userId: u.id },
              button: Button('warn', 'Ban'),
              confirm: `Ban ${u.email}?`,
            })}
        ${ActionForm({
          action: 'delete',
          fields: { userId: u.id },
          button: Button('danger', 'Delete'),
          confirm: `Delete ${u.email} permanently? This removes the user, sessions, and account links.`,
        })}
      </div>
    </td>
  </tr>`
}

function allowlistRow(a: allowlist.AllowedEmail): string {
  return `<tr>
    <td><strong>${esc(a.email)}</strong></td>
    <td class="muted">${esc(a.createdAt.slice(0, 10))}${a.createdBy ? ` · by ${esc(a.createdBy)}` : ''}</td>
    <td>${ActionForm({
      action: 'revoke-email',
      fields: { email: a.email },
      button: Button('danger', 'Revoke'),
      confirm: `Revoke sign-up for ${a.email}?`,
    })}</td>
  </tr>`
}

async function renderManage(
  c: Ctx,
  auth: Auth,
  flash?: { kind: 'ok' | 'err'; text: string },
): Promise<Response> {
  const gate = await requireAdmin(c, auth)
  if (gate instanceof Response) return gate

  const [userList, allowed, cmsAccounts, sessionStats] = await Promise.all([
    users.list(c.env),
    allowlist.list(c.env),
    accounts.listByProvider(c.env, CMS_APP.providerId),
    sessionsDomain.listStats(c.env),
  ])

  const body = `
    <article>
      <header><strong>Allowed emails</strong> <span class="muted">(${allowed.length})</span></header>
      <p class="muted" style="margin-top:-.25rem">Only emails on this list can complete sign-up. Existing users keep access.</p>
      <table>
        <thead><tr><th>Email</th><th>Added</th><th></th></tr></thead>
        <tbody>${allowed.map(allowlistRow).join('') || '<tr><td colspan="3" class="muted" style="text-align:center">No emails allowed yet — sign-up is blocked.</td></tr>'}</tbody>
      </table>
      <form method="post" action="/auth/manage" style="display:flex;gap:.5rem;align-items:center;margin-top:1rem;flex-wrap:wrap">
        <input type="hidden" name="_action" value="allow-email"/>
        <input type="email" name="email" placeholder="email@example.com" required style="margin:0;flex:1;max-width:320px"/>
        ${Button('primary', 'Allow sign-up')}
      </form>
    </article>

    <article>
      <header><strong>Users</strong> <span class="muted">(${userList.length})</span></header>
      <table>
        <thead><tr>
          <th>User</th><th>Role</th><th>CMS</th><th>Sessions</th><th>Actions</th>
        </tr></thead>
        <tbody>${userList.map((u) => userRow(u, cmsAccounts.get(u.id), sessionStats.get(u.id))).join('')}</tbody>
      </table>
    </article>
  `
  c.header('cache-control', 'private, no-store')
  return c.html(page({ me: gate.user, body, flash }))
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

  // Allowlist actions: domain layer handles normalization + mixed-script
  // rejection, returns a structured result we can flash.
  if (action === 'allow-email' || action === 'revoke-email') {
    const raw = String(form.email ?? '')
    const result = action === 'allow-email'
      ? await allowlist.allow(c.env, raw, gate.user.email)
      : await allowlist.revoke(c.env, raw)
    if (!result.ok) return renderManage(c, auth, { kind: 'err', text: result.error })
    return c.redirect('/auth/manage', 303)
  }

  const userId = String(form.userId ?? '')
  if (!userId) return renderManage(c, auth, { kind: 'err', text: 'Missing user' })

  // Foot-gun guard. 'sign-out-everywhere' is in the list because signing
  // yourself out of all devices via the manage UI is almost certainly a
  // mistake (you're in one of those devices now).
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
      case 'unlink-cms':
        await accounts.unlink(c.env, userId, CMS_APP.providerId)
        break
      case 'revoke-token':
        await accounts.revokeAndClear(c.env, CMS_APP, userId)
        break
      case 'sign-out-everywhere':
        await sessionsDomain.signOutEverywhere(c.env, userId)
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
