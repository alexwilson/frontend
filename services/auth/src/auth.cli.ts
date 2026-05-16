// Stub auth instance for the `better-auth` CLI (only used by `pnpm dev` /
// `pnpm typecheck` if better-auth itself needs an entry point at parse time).
// drizzle-kit handles schema generation now via ./drizzle.config.ts; this
// file is kept minimal for completeness.
//
// Keep plugins in sync with src/auth.ts if better-auth's CLI ever needs to
// introspect for non-migration reasons.
import { betterAuth } from 'better-auth'
import { admin, genericOAuth } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APPS } from './apps/registry'
import { schema } from './schema'

export const auth = betterAuth({
  database: drizzleAdapter({} as never, { provider: 'sqlite', schema }),
  secret: 'cli-stub-not-used',
  baseURL: 'http://localhost',
  socialProviders: {
    github: { clientId: 'stub', clientSecret: 'stub' },
  },
  plugins: [
    admin({ defaultRole: 'user', adminRoles: ['admin'] }),
    genericOAuth({
      config: APPS.map((app) => ({
        providerId: app.providerId,
        clientId: 'stub',
        clientSecret: 'stub',
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
      })),
    }),
  ],
})
