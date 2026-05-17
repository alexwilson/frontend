import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { admin, genericOAuth, jwt } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import type { Env } from './env'
import { APPS } from './apps/registry'
import { schema, allowedEmail } from './schema'
import { normalizeEmail } from './email-normalize'

// Looks up the email in the allowlist. Returns true if present (sign-up
// permitted), false otherwise. Both sides normalize through the same
// `normalizeEmail` pipeline (NFKC + mixed-script rejection) so the
// comparison is between canonical forms — a homoglyph email coming from
// GitHub won't match a Latin allowlist entry even if it renders identically.
async function isEmailAllowed(env: Env, email: string): Promise<boolean> {
  const result = normalizeEmail(email)
  if (!result.ok) return false
  const db = drizzle(env.AUTH_DB, { schema })
  const row = await db
    .select({ email: allowedEmail.email })
    .from(allowedEmail)
    .where(eq(allowedEmail.email, result.email))
    .get()
  return !!row
}

export function createAuth(env: Env) {
  const db = drizzle(env.AUTH_DB, { schema })

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema,
      // snake_case columns (Drizzle adapter's default). TS field names stay
      // camelCase; mapping happens in src/schema.ts via column declarations.
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BASE_URL,
    basePath: '/auth',
    trustedOrigins: env.TRUSTED_ORIGINS.split(',').map((s) => s.trim()),

    advanced: {
      // `auth.` namespace — all cookies the worker sets are prefixed with it,
      // so they group nicely in DevTools and never collide with cookies set by
      // unrelated apps on the same domain.
      cookiePrefix: 'auth',
      cookies: {
        session_token: {
          // Final cookie name: `__Secure-auth.session` (in prod, since baseURL
          // is https). better-auth auto-adds the __Secure- prefix when baseURL
          // is https; local dev (http://localhost) gets no prefix automatically.
          name: 'session',
          attributes: {
            // No `domain` — host-only cookie. Bound to the auth worker's
            // exact host (alexwilson.tech). A subdomain takeover on
            // *.alexwilson.tech cannot read this cookie (document.cookie is
            // scoped to the takenover host) nor exfil response bodies
            // (CORS gates that). Cross-origin SPAs on subdomains still get
            // the cookie attached to their fetch calls to alexwilson.tech
            // because (a) the cookie matches the request target host and
            // (b) shared eTLD+1 keeps them same-site for SameSite=Lax.
            path: '/auth/',
            sameSite: 'lax',
            secure: true,
            httpOnly: true,
          },
        },
      },
    },

    // Gate sign-up on the email allowlist. Existing users (already in the
    // `user` table) are unaffected — the hook fires only when better-auth
    // is about to INSERT a new user row after OAuth identity verification.
    //
    // Use APIError so better-auth produces a structured 403 with a clean
    // redirect to the configured error callback, rather than a plain
    // unhandled throw that 500s + leaks the email into server logs.
    databaseHooks: {
      user: {
        create: {
          before: async (user: { email: string }) => {
            if (!(await isEmailAllowed(env, user.email))) {
              throw new APIError('FORBIDDEN', {
                message: 'Email not on allowlist',
                code: 'EMAIL_NOT_ALLOWED',
              })
            }
            return { data: user }
          },
        },
      },
    },

    // Identity App — sign-in only. Requesting only `user:email`; the resulting
    // token has no repo capability and is discarded after the identity check.
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        scope: ['user:email'],
      },
    },

    plugins: [
      admin({
        defaultRole: 'user',
        adminRoles: ['admin'],
        // Roles still drive admin UI and the scope mapping in src/scopes.ts.
        // Runtime authorization is scope-based though — see ROLE_SCOPES.
      }),

      // JWT plugin — provides:
      //   • Persistent JWKS (jwks table). Used by both better-auth's own
      //     /auth/token and our per-app JWT minting in app-token.ts.
      //   • GET /auth/jwks for external verifiers that want to validate any
      //     of the JWTs we issue without phoning home.
      //   • POST /auth/sign-jwt — the API surface we use internally to mint
      //     custom-payload JWTs (per-app identity #1 + capability #2). Same
      //     signing key, kid header for rotation.
      //
      // We don't customize definePayload here — payloads are constructed
      // explicitly per-call in app-token.ts so the shape is obvious at the
      // call site (and so JWT #2 can include access_token + scope without
      // leaking into JWT #1).
      jwt({
        jwt: {
          issuer: env.BASE_URL,
          audience: env.BASE_URL,
          expirationTime: '15m',
        },
        // TODO(jwks-growth): better-auth keeps all historical JWKS keys
        // within jwks.gracePeriod (default 30 days) and serves them all from
        // /auth/jwks. With default rotation that grows unbounded over years.
        // Set a finite gracePeriod here, or implement a periodic prune of
        // the jwks table once we've added more apps and rotation is real.
      }),

      // To enable OIDC IdP mode (so external apps like Grafana, Gitea, etc.
      // can "Sign in with alexwilson.tech"):
      //   1. Uncomment below + mirror in src/auth.cli.ts.
      //   2. `pnpm db:generate && pnpm db:migrate:*` — schema gains OIDC tables.
      //   3. Register each external client (id/secret/redirect URIs) in the
      //      new tables.
      //   4. Update README's "What this isn't" section + Standards table.
      //
      // oidcProvider({
      //   metadata: { issuer: env.BASE_URL },
      // }),

      // Capability Apps — provider list is generated from the APPS registry.
      // Each app's class owns its own OAuth config via oauthConfig(env).
      // Adding an app = a new class under src/apps/ + an entry in registry.ts.
      genericOAuth({
        config: APPS.map((app) => app.oauthConfig(env)),
      }),
    ],
  })
}

export type Auth = ReturnType<typeof createAuth>
