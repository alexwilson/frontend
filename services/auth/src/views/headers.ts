// Security headers for the HTML surfaces of the auth worker. The two pages
// today (/auth/manage and /auth/error) share the same shell (views/layout.ts)
// so they share the same CSP — Pico CSS is inlined into the layout, and a
// tiny `data-confirm` script is appended, hence `'unsafe-inline'` on both
// style-src and script-src.
import type { Context } from 'hono'

const HTML_CSP = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join('; ')

export function applyHtmlSecurityHeaders(c: Context): void {
  c.header('content-security-policy', HTML_CSP)
  c.header('x-frame-options', 'DENY')
  c.header('x-content-type-options', 'nosniff')
  c.header('referrer-policy', 'strict-origin-when-cross-origin')
  c.header('permissions-policy', 'interest-cohort=()')
  // 1 year + subdomains, no `preload` — kept reversible. Cloudflare's edge
  // may also set this; identical values collapse harmlessly.
  c.header('strict-transport-security', 'max-age=31536000; includeSubDomains')
}
