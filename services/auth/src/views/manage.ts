// Manage UI — pure rendering. Controller (src/manage.ts) fetches data,
// passes props, this returns HTML. No DB / Hono / Request access here.
//
// Markup leans on Pico's classless idioms wherever possible:
//   • <article> = a self-contained card (a user). Pico styles padding,
//     border, shadow, header/footer backgrounds.
//   • <hgroup>  = title + subtitle grouping in the article header.
//   • <small>   = muted secondary text (we don't ship a .muted class).
//   • <code>    = user UUID (Pico styles it monospace).
//   • <details> + <summary> = expandable sessions list. Pico provides the
//     disclosure marker by default; we don't add our own.
//   • <figure>  = scroll wrapper for the allowlist <table> on narrow screens.
//   • <fieldset role="group"> = grouped form controls (input+button, button
//     bar). Pico handles horizontal layout + connected styling.
//   • <button> / <input type="submit"> = Pico-styled by default (= primary).
//     class="secondary" / "contrast" for variants. Custom "warn"/"danger"
//     classes layer on top via Pico's CSS variables.
import type { AppPlugin } from '../apps/types'
import type { AdminUser } from '../domain/users'
import type { AllowedEmail } from '../domain/allowlist'
import type { AccountInfo } from '../domain/accounts'
import { IDLE_THRESHOLD_MS } from '../domain/accounts'
import type { SessionRow } from '../domain/sessions'
import { page } from './layout'
import { ActionForm, Badge, Button, esc, formatAgo } from './components'

const ROLES = ['user', 'cms-editor', 'admin'] as const

export interface RenderManagePageOpts {
  me: AdminUser
  /** The admin's currently active session id — used to mark "this device" and hide its sign-out button. */
  currentSessionId: string
  users: AdminUser[]
  allowlist: AllowedEmail[]
  /** Registered apps (iterated for the per-user Apps list). */
  apps: readonly AppPlugin[]
  /** Map<userId, Map<providerId, AccountInfo>> — per-app account state. */
  accountsByUser: Map<string, Map<string, AccountInfo>>
  /** Map<userId, SessionRow[]> — per-user active sessions for the expandable list. */
  sessionsByUser: Map<string, SessionRow[]>
  flash?: { kind: 'ok' | 'err'; text: string }
}

export function renderManagePage(opts: RenderManagePageOpts): string {
  const body = `
    <section>
      <h2>Users <small>(${opts.users.length})</small></h2>
      ${opts.users.map((u) => userCard({
        user: u,
        apps: opts.apps,
        accounts: opts.accountsByUser.get(u.id),
        sessions: opts.sessionsByUser.get(u.id) ?? [],
        currentSessionId: opts.currentSessionId,
      })).join('')}
    </section>

    <section>
      <h2>Invitations <small>(${opts.allowlist.length})</small></h2>
      <p><small>Only emails on this list can complete sign-up. Existing users keep access.</small></p>
      <article>
        <figure>
          <table>
            <thead><tr><th>Email</th><th>Added</th><th></th></tr></thead>
            <tbody>${opts.allowlist.map(allowlistRow).join('') || `<tr><td colspan="3"><small>No invitations yet — sign-up is blocked for new emails.</small></td></tr>`}</tbody>
          </table>
        </figure>
        <form method="post" action="/auth/manage">
          <input type="hidden" name="_action" value="allow-email"/>
          <fieldset role="group">
            <input type="email" name="email" placeholder="email@example.com" required/>
            <input type="submit" value="Invite"/>
          </fieldset>
        </form>
      </article>
    </section>
  `
  return page({
    title: 'auth · manage',
    headerTitle: 'auth · manage',
    headerRight: `<small>${esc(opts.me.email)}</small>`,
    body,
    flash: opts.flash,
  })
}

// ─── User card ───────────────────────────────────────────────────────────

interface UserCardProps {
  user: AdminUser
  apps: readonly AppPlugin[]
  accounts: Map<string, AccountInfo> | undefined
  sessions: SessionRow[]
  currentSessionId: string
}

function userCard(p: UserCardProps): string {
  const { user: u, apps, accounts, sessions, currentSessionId } = p
  const userApps = accounts ?? new Map<string, AccountInfo>()
  return `<article${u.banned ? ' style="opacity:.6"' : ''}>
    <header>
      <hgroup>
        <h4>
          ${esc(u.email)}
          ${u.role === 'admin' ? ' ' + Badge('admin', 'admin') : ''}
          ${u.banned ? ' ' + Badge('banned', 'banned') : ''}
        </h4>
        <p>${u.name ? `${esc(u.name)} · ` : ''}<code>${esc(u.id)}</code></p>
      </hgroup>
      <form method="post" action="/auth/manage" aria-label="Change role">
        <input type="hidden" name="_action" value="set-role"/>
        <input type="hidden" name="userId" value="${esc(u.id)}"/>
        <fieldset role="group">
          <select name="role" aria-label="Role">
            ${ROLES.map((r) => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
          <input type="submit" value="Save"/>
        </fieldset>
      </form>
    </header>

    <details open>
      <summary>Apps</summary>
      <ul class="app-list">
        ${apps.map((app) => appRow(u.id, u.email, app, userApps.get(app.providerId))).join('')}
      </ul>
    </details>

    <details>
      <summary>${sessions.length === 0
        ? `Sessions <small>(none active)</small>`
        : `Sessions <small>(${sessions.length})</small>`}</summary>
      ${sessions.length > 0 ? `<ul class="session-list">
        ${sessions.map((s) => sessionItem(u.email, s, currentSessionId)).join('')}
      </ul>` : ''}
    </details>

    <footer>
      <div class="actions">
        ${sessions.length > 0
          ? ActionForm({
              action: 'sign-out-everywhere',
              fields: { userId: u.id },
              button: Button('warn', 'Sign out all'),
              confirm: `Sign out ${u.email} from all ${sessions.length} device${sessions.length === 1 ? '' : 's'}? They'll need to sign in again everywhere.`,
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
    </footer>
  </article>`
}

// ─── Apps list ───────────────────────────────────────────────────────────

function appStatusBadge(app: AppPlugin, info: AccountInfo | undefined): string {
  if (!info?.hasRow) return Badge('unlinked', 'Not linked', `No ${app.name} account row for this user`)
  if (!info.hasToken) return Badge('cleared', 'Token cleared', 'Account linked, refresh token kept; transparently re-issues on next use')
  if (!info.lastIssuedAt) return Badge('idle', 'Idle', 'Token exists but never brokered — cron will revoke on next tick')
  const age = Date.now() - info.lastIssuedAt.getTime()
  const ago = formatAgo(age)
  if (age < IDLE_THRESHOLD_MS) return Badge('active', 'Active', `Last brokered ${ago} ago`)
  return Badge('idle', 'Idle', `Last brokered ${ago} ago — cron will revoke on next tick`)
}

function appRow(userId: string, userEmail: string, app: AppPlugin, info: AccountInfo | undefined): string {
  const actions: string[] = []
  if (info?.hasToken) {
    actions.push(ActionForm({
      action: 'revoke-app-token',
      fields: { userId, appId: app.id },
      button: Button('warn', 'Revoke'),
      confirm: `Revoke ${app.name} access token for ${userEmail}? They'll transparently get a new one on next use (refresh token kept).`,
    }))
  }
  if (info?.hasRow) {
    actions.push(ActionForm({
      action: 'unlink-app',
      fields: { userId, appId: app.id },
      button: Button('warn', 'Unlink'),
      confirm: `Unlink ${app.name} for ${userEmail}? They'll need to re-OAuth.`,
    }))
  }
  return `<li>
    <span class="app-name">${esc(app.name)}</span>
    ${appStatusBadge(app, info)}
    ${actions.length > 0 ? `<span class="app-actions">${actions.join('')}</span>` : ''}
  </li>`
}

// ─── Sessions ────────────────────────────────────────────────────────────

function sessionItem(userEmail: string, s: SessionRow, currentSessionId: string): string {
  const now = Date.now()
  const createdAgo = formatAgo(now - s.createdAt.getTime())
  const lastSeenAgo = formatAgo(now - s.updatedAt.getTime())
  const expiresIn = s.expiresAt.getTime() - now
  const expiresLabel = expiresIn > 0 ? `in ${formatAgo(expiresIn)}` : 'expired'
  const isCurrent = s.id === currentSessionId

  const locParts: string[] = []
  if (s.city) locParts.push(s.city)
  if (s.region && s.region !== s.city) locParts.push(s.region)
  if (s.country) locParts.push(s.country)
  const locLabel = locParts.join(', ')

  const netLabel = (() => {
    const asnLabel = typeof s.asn === 'number' ? `AS${s.asn}` : null
    if (s.asOrganization && asnLabel) return `${s.asOrganization} (${asnLabel})`
    return s.asOrganization ?? asnLabel ?? null
  })()

  // Hide the per-session sign-out for the admin's current device — easy
  // foot-gun otherwise (they'd lock themselves out of the page they're on).
  const revokeButton = isCurrent
    ? `<small><strong>this device</strong></small>`
    : ActionForm({
        action: 'sign-out-session',
        fields: { sessionId: s.id },
        button: Button('warn', 'Sign out'),
        confirm: `Sign out this specific device for ${userEmail}?`,
      })

  const whereParts: string[] = []
  if (locLabel) whereParts.push(`<strong>${esc(locLabel)}</strong>`)
  if (netLabel) whereParts.push(`<small>${esc(netLabel)}</small>`)
  if (s.ipAddress) whereParts.push(`<small><code>${esc(s.ipAddress)}</code></small>`)
  const wherePart = whereParts.length > 0
    ? whereParts.join(' · ')
    : '<small>unknown origin</small>'

  const metaParts = [
    `started ${createdAgo} ago`,
    `last seen ${lastSeenAgo} ago`,
    `expires ${expiresLabel}`,
  ]
  if (s.timezone) metaParts.push(esc(s.timezone))

  return `<li class="session-item">
    <div class="session-info">
      <div>${wherePart}</div>
      <small>${metaParts.join(' · ')}</small>
      ${s.impersonatedBy ? `<div>${Badge('admin', 'impersonated', `By admin id: ${s.impersonatedBy}`)}</div>` : ''}
      ${s.userAgent ? `<small><code>${esc(s.userAgent)}</code></small>` : ''}
    </div>
    <div>${revokeButton}</div>
  </li>`
}

// ─── Allowlist row ───────────────────────────────────────────────────────

function allowlistRow(a: AllowedEmail): string {
  return `<tr>
    <td>${esc(a.email)}</td>
    <td><small>${esc(a.createdAt.slice(0, 10))}${a.createdBy ? ` · by ${esc(a.createdBy)}` : ''}</small></td>
    <td>${ActionForm({
      action: 'revoke-email',
      fields: { email: a.email },
      button: Button('danger', 'Revoke'),
      confirm: `Revoke sign-up for ${a.email}?`,
    })}</td>
  </tr>`
}
