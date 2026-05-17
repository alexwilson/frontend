// Reusable view primitives + shared CSS.
//
// Everything here is pure: takes typed props, returns an HTML string. Same
// authoring ergonomics as React components, zero runtime.
//
// Philosophy: ride Pico's classless defaults as far as possible. The CSS
// block below only adds what Pico can't express semantically — badges,
// app/session list layouts, and `warn`/`danger` button variants (Pico's
// palette stops at primary/secondary/contrast).

export const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!),
  )

// ─── Components ──────────────────────────────────────────────────────────

export type BadgeKind = 'active' | 'idle' | 'cleared' | 'unlinked' | 'admin' | 'banned'
export const Badge = (kind: BadgeKind, text: string, hint?: string): string =>
  `<span class="badge badge-${kind}"${hint ? ` title="${esc(hint)}"` : ''}>${esc(text)}</span>`

// Pico styles <input type="submit"> as primary by default. We use the
// classless form for primary, and Pico's documented `secondary` class for
// the muted variant. `warn` and `danger` are our additions — Pico's palette
// doesn't include semantic warning/destructive colors, so we layer them via
// Pico's --pico-* variables in the CSS below.
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warn'
export const Button = (variant: ButtonVariant, label: string): string => {
  const cls =
    variant === 'primary' ? '' :
    variant === 'secondary' ? ' class="secondary"' :
    ` class="${variant}"`
  return `<input type="submit"${cls} value="${esc(label)}"/>`
}

// Wraps a button-form. If `confirm` is set, vanilla JS in layout.ts confirms
// before submit (forms are matched via the `data-confirm` attribute).
export interface ActionFormProps {
  action: string
  fields: Record<string, string>
  button: string
  confirm?: string
}
export const ActionForm = (p: ActionFormProps): string =>
  `<form method="post" action="/auth/manage"${p.confirm ? ` data-confirm="${esc(p.confirm)}"` : ''}>
    <input type="hidden" name="_action" value="${esc(p.action)}"/>
    ${Object.entries(p.fields).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}"/>`).join('')}
    ${p.button}
  </form>`

// ─── Helpers ─────────────────────────────────────────────────────────────

// Compact "Nd / Nh / Nm / Ns" — for "N min ago" labels in dense tables.
export function formatAgo(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

// ─── CSS ─────────────────────────────────────────────────────────────────
// Minimal layer on top of Pico. What's here vs. delegated to Pico:
//   • Header + section spacing: Pico defaults are fine; we just adjust the
//     app-header to be a flex row.
//   • Tables, articles, details/summary, forms, buttons: Pico-styled, no
//     overrides except the warn/danger button colors below.
//   • Badges: no Pico equivalent — custom pill class.
//   • App list + session list: custom item-row layout for dense info display.
//   • .actions: flex wrapper for the destructive-action button row in
//     article footers. Each action is its own <form>, so role="group"
//     doesn't fit (it expects sibling form controls, not multiple forms).

export const CUSTOM_CSS = `
/* Density. Pico's defaults are roomy (intended for marketing/forms-as-CTAs);
   admin tables-of-controls need tighter. These five overrides are the
   minimum to shrink buttons + selects + inputs uniformly across the page. */
main.container {
  --pico-font-size: 90%;
  --pico-form-element-spacing-vertical: .4rem;
  --pico-form-element-spacing-horizontal: .65rem;
  --pico-spacing: .75rem;
  --pico-typography-spacing-vertical: .75rem;
}

header.app-header {
  display: flex; justify-content: space-between; align-items: center;
  padding-block: var(--pico-spacing);
  margin-bottom: var(--pico-spacing);
  border-bottom: var(--pico-border-width) solid var(--pico-muted-border-color);
}

section > h2 { margin-bottom: var(--pico-spacing); }

/* User card header: title/subtitle on the left, role control on the right.
   Flex-wrap so the form drops below on narrow viewports. */
article > header {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: var(--pico-spacing); flex-wrap: wrap;
}
article > header hgroup { margin: 0; flex: 1 1 auto; min-width: 0; }
article > header h4 { margin-bottom: .15rem; }
article > header hgroup p { margin: 0; }
article > header > form { margin: 0; flex: 0 0 auto; }

/* <details> sections inside the card — consistent spacing between summary
   and revealed content for both Apps and Sessions. */
article > details { margin: 0; padding-block: .4rem; }
article > details > summary { font-weight: 600; }
article > details[open] > summary { margin-bottom: .35rem; }

/* Apps list — semantic <ul> styled as a stacked list of app rows. */
ul.app-list { list-style: none; padding: 0; margin: 0; }
ul.app-list li {
  display: flex; align-items: center; gap: .5rem;
  padding: .25rem 0;
}
ul.app-list li + li { border-top: var(--pico-border-width) solid var(--pico-muted-border-color); }
.app-name { font-weight: 600; min-width: 60px; }
.app-actions { display: inline-flex; gap: .25rem; margin-left: auto; }
.app-actions form { margin: 0; }
.app-actions input[type="submit"] { margin: 0; }

/* Sessions list under <details>. */
ul.session-list { list-style: none; padding: 0; margin: 0; }
.session-item {
  display: flex; gap: .5rem; align-items: flex-start;
  padding: .5rem 0; border-top: var(--pico-border-width) solid var(--pico-muted-border-color);
}
.session-item:first-child { border-top: none; }
.session-info { flex: 1; min-width: 0; }
.session-info > * + * { margin-top: .15rem; }
.session-info code { font-size: .7rem; word-break: break-all; }

/* Actions row in article footers — flex layout for separate <form>s. */
.actions { display: flex; gap: .25rem; flex-wrap: wrap; }
.actions form { margin: 0; }
.actions input[type="submit"] { margin: 0; }

/* Pico's flash equivalent. Pico ships no built-in alert component; this
   matches the look of the badges so the page has one visual vocabulary. */
.flash {
  padding: var(--pico-form-element-spacing-vertical) var(--pico-form-element-spacing-horizontal);
  margin-bottom: var(--pico-spacing);
  border-radius: var(--pico-border-radius);
}
.flash-ok { background: #d1fae5; color: #065f46; }
.flash-err { background: #fee2e2; color: #991b1b; }

/* ─── Badges (Pico has no equivalent) ──────────────────────────────── */
.badge {
  display: inline-block; padding: 1px 7px; border-radius: 999px;
  font-size: .68rem; font-weight: 600; vertical-align: middle;
  letter-spacing: .02em; line-height: 1.5;
}
.badge-active { background: #d1fae5; color: #065f46; }
.badge-idle { background: #fef3c7; color: #92400e; }
.badge-cleared { background: #e5e7eb; color: #374151; }
.badge-unlinked { background: transparent; color: var(--pico-muted-color); border: var(--pico-border-width) dashed var(--pico-muted-border-color); }
.badge-admin { background: #dbeafe; color: #1e40af; }
.badge-banned { background: #fee2e2; color: #991b1b; }

/* ─── Button variants Pico doesn't ship ─────────────────────────────── */
/* Use Pico's --pico-* variables so hover/focus + dark-mode adaption come
   for free. Semantic: warn = caution (revoke, ban, sign-out), danger =
   destructive (delete, revoke-invite). */
input[type="submit"].warn,
button.warn {
  --pico-background-color: #d97706;
  --pico-border-color: #d97706;
  --pico-color: #fff;
  --pico-primary: #d97706;
  --pico-primary-hover: #b45309;
}
input[type="submit"].danger,
button.danger {
  --pico-background-color: #dc2626;
  --pico-border-color: #dc2626;
  --pico-color: #fff;
  --pico-primary: #dc2626;
  --pico-primary-hover: #b91c1c;
}
`
