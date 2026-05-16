import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { admin, genericOAuth } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import type { Env } from './env'
import { APPS } from './apps/registry'
import { schema, allowedEmail } from './schema'

// Looks up the email in the allowlist. Returns true if present (sign-up
// permitted), false otherwise. Case-insensitive — emails are normalised to
// lowercase on both write and read.
async function isEmailAllowed(env: Env, email: string): Promise<boolean> {
  const db = drizzle(env.AUTH_DB, { schema })
  const row = await db
    .select({ email: allowedEmail.email })
    .from(allowedEmail)
    .where(eq(allowedEmail.email, email.toLowerCase()))
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
      cookies: {
        sessionToken: {
          attributes: {
            domain: env.COOKIE_DOMAIN,
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
        // Roles permitted to invoke /auth/app/token are defined per-app in
        // src/apps/*.ts. 'admin' is granted implicit access to all of them.
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
