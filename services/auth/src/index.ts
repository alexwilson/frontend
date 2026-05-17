import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createAuth } from './auth'
import { appById } from './apps/registry'
import { handleAppToken, handleAppSignOut } from './app-token'
import { handleManage, handleManageSignIn } from './manage'
import { handleScheduled } from './cron'
import { renderErrorPageFromCode } from './views/error'
import type { Env } from './env'

export type { Env } from './env'

function trustedOrigins(env: Env): string[] {
  return env.TRUSTED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
}

const app = new Hono<{ Bindings: Env }>()

// CORS — scoped to SPA-callable routes only. Routes called same-origin or
// server-to-server (admin UI, better-auth's admin plugin endpoints) do NOT
// echo CORS, which keeps allow-list enumeration limited to the smaller
// SPA-facing surface.
const corsMiddleware = cors({
  origin: (origin, c) => (trustedOrigins(c.env).includes(origin) ? origin : null),
  credentials: true,
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
})

// Apply CORS to /auth/* except management routes (server-rendered, same-
// origin) and better-auth's admin plugin API (server-side calls only via
// auth.api.* — never called from a browser SPA).
app.use('/auth/*', async (c, next) => {
  const path = c.req.path
  if (
    path === '/auth/manage' ||
    path === '/auth/manage/sign-in' ||
    path.startsWith('/auth/admin/')
  ) {
    return next()
  }
  return corsMiddleware(c, next)
})

// Per-app capability endpoint. `:id` matches anything; appById gates on the
// registry. Unknown ids 404 before any auth work happens.
app.on(['GET', 'POST'], '/auth/app/:id/token', async (c) => {
  const plugin = appById(c.req.param('id'))
  if (!plugin) return c.notFound()
  const auth = createAuth(c.env)
  return handleAppToken(c, auth, plugin)
})

// Intercept sign-out to revoke per-app credentials + clear per-app JWT #1
// cookies before better-auth clears the session.
app.post('/auth/sign-out', async (c) => {
  const auth = createAuth(c.env)
  return handleAppSignOut(c, auth)
})

// Server-rendered admin UI. Same handler for GET (render) + POST (mutate).
app.on(['GET', 'POST'], '/auth/manage', async (c) => {
  const auth = createAuth(c.env)
  return handleManage(c, auth)
})

app.get('/auth/manage/sign-in', async (c) => {
  const auth = createAuth(c.env)
  return handleManageSignIn(c, auth)
})

// Error landing page — better-auth's onAPIError.errorURL redirects here
// with ?error=<code>. Public; no auth gate (the user usually isn't signed
// in when seeing this).
app.get('/auth/error', (c) => {
  return c.html(renderErrorPageFromCode(c.req.query('error')))
})

// Everything else under /auth/* is owned by better-auth.
app.all('/auth/*', async (c) => {
  const auth = createAuth(c.env)
  return auth.handler(c.req.raw)
})

// Workers' module syntax: `fetch` for HTTP, `scheduled` for cron triggers
// (configured in wrangler.toml [triggers]).
export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
}
