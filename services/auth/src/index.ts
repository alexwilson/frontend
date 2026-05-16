import { createAuth } from './auth'
import { handleAppToken, handleAppSignOut } from './app-token'
import { handleManage, handleManageSignIn } from './manage'
import type { Env } from './env'

export type { Env } from './env'

function trustedOrigins(env: Env): string[] {
  return env.TRUSTED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
}

// Adds Access-Control-Allow-Origin and friends to a response for trusted origins.
// Browsers reject credentialed responses without these headers even if the body
// arrived intact.
//
// Uses `new Response(body, response)` rather than building Headers manually —
// the init-from-response form is the documented Workers way to preserve all
// headers (including multi-value Set-Cookie) without merging or dropping any.
function withCors(response: Response, origin: string | null, env: Env): Response {
  if (!origin || !trustedOrigins(env).includes(origin)) return response
  const wrapped = new Response(response.body, response)
  wrapped.headers.set('Access-Control-Allow-Origin', origin)
  wrapped.headers.set('Access-Control-Allow-Credentials', 'true')
  wrapped.headers.append('Vary', 'Origin')
  return wrapped
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)
    const origin = request.headers.get('Origin')

    // CORS preflight. Better-auth's handler doesn't reliably respond to OPTIONS
    // on all of its routes, so we answer here before dispatching.
    if (request.method === 'OPTIONS' && pathname.startsWith('/auth/')) {
      if (origin && trustedOrigins(env).includes(origin)) {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '86400',
            'Vary': 'Origin',
          },
        })
      }
      return new Response(null, { status: 403 })
    }

    const auth = createAuth(env)
    let response: Response

    if (pathname === '/auth/app/token') {
      response = await handleAppToken(request, env, auth)
    } else if (pathname === '/auth/sign-out') {
      // Intercept sign-out to revoke per-app GitHub tokens before better-auth
      // clears the session. The handler delegates back to better-auth after
      // doing its revocation work.
      response = await handleAppSignOut(request, env, auth)
    } else if (pathname === '/auth/manage') {
      response = await handleManage(request, env, auth)
    } else if (pathname === '/auth/manage/sign-in') {
      response = await handleManageSignIn(request, env, auth)
    } else if (pathname.startsWith('/auth/')) {
      response = await auth.handler(request)
    } else {
      return new Response('Not Found', { status: 404 })
    }

    return withCors(response, origin, env)
  },
}
