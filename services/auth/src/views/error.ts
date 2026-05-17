// Generic error page — for surfaces where we redirect users (sign-up
// rejected, OAuth link failed, generic 4xx/5xx) and want to show something
// readable rather than a raw text response.
//
// Pure: takes typed props, returns HTML string. Controller is responsible
// for status code + redirect URL handling.
//
// Better-auth's various redirectOnError paths default to
// `${baseURL}/error?error=<code>` — wire this page at /auth/manage/error
// (or similar) and surface a friendly message from the `error` query.
import { page } from './layout'
import { Button, esc } from './components'

export interface RenderErrorPageOpts {
  title?: string
  /** Short headline — e.g. "Sign-up not allowed". */
  heading: string
  /** One-paragraph human-readable explanation. */
  message: string
  /** Optional technical detail shown muted underneath (error code, etc.). */
  detail?: string
  /** Optional retry/back link. */
  retry?: { label: string; href: string }
}

export function renderErrorPage(opts: RenderErrorPageOpts): string {
  const body = `<article>
    <h2 style="margin-bottom:.5rem">${esc(opts.heading)}</h2>
    <p>${esc(opts.message)}</p>
    ${opts.detail ? `<p class="muted" style="margin-top:1rem"><code>${esc(opts.detail)}</code></p>` : ''}
    ${opts.retry
      ? `<p style="margin-top:1.25rem"><a href="${esc(opts.retry.href)}" class="btn btn-primary" style="text-decoration:none">${esc(opts.retry.label)}</a></p>`
      : ''}
  </article>`
  return page({
    title: opts.title ?? 'auth · error',
    headerTitle: 'auth',
    body,
  })
}

// ─── Convenience renderers for well-known error codes ────────────────────
// Map raw `?error=<code>` query values (emitted by better-auth and our own
// redirectOnError sites) to friendly copy. Unknown codes fall through to
// the generic message.

const KNOWN_ERRORS: Record<string, { heading: string; message: string }> = {
  EMAIL_NOT_ALLOWED: {
    heading: 'Sign-up not allowed',
    message: "Your email isn't on the allowlist for this site. If you think this is a mistake, contact the admin.",
  },
  issuer_mismatch: {
    heading: 'OAuth provider mismatch',
    message: 'The identity provider returned an unexpected issuer. Please try again — if this keeps happening, the provider configuration may have changed.',
  },
  issuer_missing: {
    heading: 'OAuth provider response invalid',
    message: 'The identity provider response was missing required information. Please try signing in again.',
  },
  oAuth_code_missing: {
    heading: 'Sign-in interrupted',
    message: 'The sign-in flow was cancelled or interrupted before it completed. Please try again.',
  },
  state_mismatch: {
    heading: 'Sign-in security check failed',
    message: 'The sign-in flow could not be verified — this can happen if the page was reloaded mid-flow or cookies were cleared. Please start sign-in again.',
  },
}

export function renderErrorPageFromCode(code: string | null | undefined): string {
  const known = code ? KNOWN_ERRORS[code] : undefined
  return renderErrorPage({
    heading: known?.heading ?? 'Something went wrong',
    message: known?.message ?? "We hit an unexpected error during authentication. Try again, or contact the admin if it keeps happening.",
    detail: code ? `error=${code}` : undefined,
    retry: { label: 'Back to sign-in', href: '/auth/manage/sign-in' },
  })
}
