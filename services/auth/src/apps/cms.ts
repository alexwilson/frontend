import { request as octokitRequest } from '@octokit/request'
import { and, eq } from 'drizzle-orm'
import type { Env } from '../env'
import type { AppContext, AppPlugin, OAuthProviderConfig } from './types'
import { account } from '../schema'

// Fetches GitHub user info via the App's user-to-server token, falling back
// to /user/emails when /user.email is null (private emails). Better-auth's
// built-in 'github' social provider does this; genericOAuth doesn't, so we
// replicate per-provider.
async function githubUserInfo(tokens: { accessToken?: string }) {
  if (!tokens.accessToken) return null
  const gh = octokitRequest.defaults({
    headers: {
      authorization: `Bearer ${tokens.accessToken}`,
      'user-agent': 'alexwilson-auth',
    },
  })

  try {
    const { data: user } = await gh('GET /user')
    let email = user.email
    let emailVerified = !!email
    if (!email) {
      const { data: emails } = await gh('GET /user/emails')
      const pick = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified)
      if (pick) {
        email = pick.email
        emailVerified = true
      }
    }
    if (!email) return null
    return {
      id: String(user.id),
      name: user.name ?? user.login,
      email,
      emailVerified,
      image: user.avatar_url,
    }
  } catch {
    return null
  }
}

export class CmsApp implements AppPlugin {
  readonly id = 'cms'
  readonly providerId = 'github-cms'
  readonly requiredRoles = ['cms-editor', 'admin'] as const

  oauthConfig(env: Env): OAuthProviderConfig {
    const { id, secret } = this.creds(env)
    return {
      providerId: this.providerId,
      clientId: id,
      clientSecret: secret,
      authorizationUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      getUserInfo: githubUserInfo,
      // GitHub Apps ignore OAuth scope=; what matters is the App's User
      // permissions configured on github.com. Kept here for documentation +
      // forward-compatibility with future better-auth versions that honour it.
      scopes: ['user:email'],
    }
  }

  // Revoke the user-to-server token at GitHub and drop the account row.
  // GitHub revocation kills both access + refresh tokens within seconds,
  // bounding the post-sign-out exposure of the 8h-floor access token.
  async onSignOut(ctx: AppContext): Promise<void> {
    const row = await ctx.db
      .select({ accessToken: account.accessToken })
      .from(account)
      .where(and(eq(account.userId, ctx.userId), eq(account.providerId, this.providerId)))
      .get()

    if (row?.accessToken) {
      await this.revokeAtGitHub(ctx.env, row.accessToken)
    }
    await ctx.db
      .delete(account)
      .where(and(eq(account.userId, ctx.userId), eq(account.providerId, this.providerId)))
      .run()
  }

  // Admin-driven unlink (no GitHub revocation by default — admin may want to
  // leave the user's GitHub authorization standing; only the local link goes).
  async onUnlink(ctx: AppContext): Promise<void> {
    await ctx.db
      .delete(account)
      .where(and(eq(account.userId, ctx.userId), eq(account.providerId, this.providerId)))
      .run()
  }

  // App-specific claims returned alongside the token. Decap doesn't read these
  // today, but they're useful for any consumer that wants to know what scope
  // of access the token was minted for without making a GitHub API probe.
  async claims(_ctx: AppContext): Promise<Record<string, unknown>> {
    return {
      repository: 'alexwilson/content',
      permissions: ['contents:write', 'metadata:read', 'pull_requests:write'],
    }
  }

  private creds(env: Env): { id: string; secret: string } {
    const id = env.GITHUB_CMS_CLIENT_ID
    const secret = env.GITHUB_CMS_CLIENT_SECRET
    if (!id || !secret) {
      throw new Error('CMS App credentials missing: GITHUB_CMS_CLIENT_ID / GITHUB_CMS_CLIENT_SECRET')
    }
    return { id, secret }
  }

  private async revokeAtGitHub(env: Env, accessToken: string): Promise<void> {
    const { id, secret } = this.creds(env)
    const basic = btoa(`${id}:${secret}`)
    try {
      await octokitRequest('DELETE /applications/{client_id}/token', {
        client_id: id,
        access_token: accessToken,
        headers: {
          authorization: `basic ${basic}`,
          'user-agent': 'alexwilson-auth',
        },
      })
    } catch {
      // Best-effort. Sign-out flow continues even if GitHub revocation fails.
    }
  }
}
