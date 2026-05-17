import { request as octokitRequest } from '@octokit/request'
import type { Env } from '../env'
import type { AppContext, AppPlugin, OAuthProviderConfig } from './types'
import { SCOPES } from '../scopes'
import { dbFor } from '../domain/db'
import * as accounts from '../domain/accounts'

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
  readonly name = 'CMS'
  readonly providerId = 'github-cms'
  // Scopes this app can grant. The endpoint intersects this with the
  // caller's request + the user's role-derived set, so possessing 'cms-editor'
  // (which carries cms:read/write/publish) is what unlocks these in practice.
  readonly grantedScopes = [SCOPES.CMS_READ, SCOPES.CMS_WRITE, SCOPES.CMS_PUBLISH] as const

  oauthConfig(env: Env): OAuthProviderConfig {
    const { id, secret } = this.creds(env)
    return {
      providerId: this.providerId,
      clientId: id,
      clientSecret: secret,
      authorizationUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      // RFC 9207 issuer. GitHub doesn't currently include `iss` in OAuth
      // callbacks (the RFC is from 2022; GitHub's OAuth predates it). Setting
      // this is a no-op today — better-auth's check only runs when ?iss is
      // present. If GitHub ever starts emitting it, we'll validate against
      // this value automatically without a code change. See threat model T14.
      issuer: 'https://github.com',
      getUserInfo: githubUserInfo,
      // GitHub Apps ignore OAuth scope=; what matters is the App's User
      // permissions configured on github.com. Kept here for documentation +
      // forward-compatibility with future better-auth versions that honour it.
      scopes: ['user:email'],
    }
  }

  // Per-device sign-out: revoke the upstream access token at GitHub and NULL
  // it in our DB, but keep the row + refresh_token. Other concurrent sessions
  // for the same user transparently refresh-grant on their next call.
  // Better-auth's session model is shared-token-per-(user,provider), so
  // DELETEing the row would force every other device to re-OAuth — surprising
  // and bad UX. See SECURITY.md and services/cms/BFF.md for the design notes.
  async onSignOut(ctx: AppContext): Promise<void> {
    await accounts.revokeAndClear(dbFor(ctx.env), ctx.env, this, ctx.userId)
  }

  // Public AppPlugin contract — same revocation call as onSignOut uses, but
  // exposed so the idle-revocation cron can call it without going through
  // the full sign-out path (which would also delete the row + refresh token).
  async revokeAccessToken(env: Env, accessToken: string): Promise<void> {
    await this.revokeAtGitHub(env, accessToken)
  }

  async onUnlink(ctx: AppContext): Promise<void> {
    await accounts.unlink(dbFor(ctx.env), ctx.env, this, ctx.userId)
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
