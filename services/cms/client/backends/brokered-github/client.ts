import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

export interface CmsTokenResult {
  jwt: string
  access_token: string
  scope: string
  claims: Record<string, unknown>
  expires_in: number
}

export type ProbeResult =
  | { kind: 'token'; data: CmsTokenResult }
  | { kind: 'link'; providerId: string }

export class RoleDeniedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RoleDeniedError'
  }
}

// One JWKS resolver per auth-worker origin. jose caches keys and refreshes
// on kid miss; sharing the instance lets that cache do its job across calls.
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()
function jwksFor(authUrl: string): ReturnType<typeof createRemoteJWKSet> {
  let resolver = jwksCache.get(authUrl)
  if (!resolver) {
    resolver = createRemoteJWKSet(new URL(`${authUrl}/auth/jwks`))
    jwksCache.set(authUrl, resolver)
  }
  return resolver
}

async function parseTokenJwt(jwt: string, authUrl: string): Promise<CmsTokenResult | null> {
  let p: JWTPayload
  try {
    const verified = await jwtVerify(jwt, jwksFor(authUrl), {
      issuer: authUrl,
      audience: 'cms',
    })
    p = verified.payload
  } catch {
    return null
  }
  if ((p as { typ?: unknown }).typ !== 'access') return null
  const access_token = typeof p.access_token === 'string' ? p.access_token : ''
  const scope = typeof p.scope === 'string' ? p.scope : ''
  if (!access_token) return null
  const now = Math.floor(Date.now() / 1000)
  const exp = typeof p.exp === 'number' ? p.exp : now
  const reserved = new Set(['sub', 'email', 'app', 'typ', 'scope', 'access_token', 'iat', 'exp', 'iss', 'aud', 'nbf', 'jti'])
  const claims: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(p)) if (!reserved.has(k)) claims[k] = v
  return {
    jwt,
    access_token,
    scope,
    claims,
    expires_in: Math.max(0, exp - now),
  }
}

export async function probeCmsToken(authUrl: string): Promise<ProbeResult> {
  const res = await fetch(`${authUrl}/auth/app/cms/token`, {
    method: 'GET',
    credentials: 'include',
  })
  if (res.ok) {
    const body = (await res.json().catch(() => ({}))) as unknown
    const jwt = (body as { jwt?: unknown }).jwt
    if (typeof jwt !== 'string') throw new Error('Token response missing jwt field')
    const parsed = await parseTokenJwt(jwt, authUrl)
    if (!parsed) throw new Error('Token response carried malformed JWT')
    return { kind: 'token', data: parsed }
  }
  if (res.status === 401) {
    const body = (await res.json().catch(() => ({}))) as unknown
    const needsLink = (body as { needsLink?: unknown }).needsLink
    const provider = (body as { provider?: unknown }).provider
    if (needsLink === true && typeof provider === 'string' && provider.length > 0) {
      return { kind: 'link', providerId: provider }
    }
    throw new Error('Sign-in did not complete. Please try again.')
  }
  if (res.status === 403) {
    throw new RoleDeniedError('Your account is signed in but lacks CMS access. Ask an admin for the cms-editor role.')
  }
  throw new Error(`Token fetch failed: ${res.status}`)
}
