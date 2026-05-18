import React from 'react'
import { GitHubBackend } from 'decap-cms-backend-github'
import { createAuthClient } from 'better-auth/client'
import { genericOAuthClient } from 'better-auth/client/plugins'
import { probeCmsToken } from './client'
import { makeCmsLogin, type AuthClient, type AuthComponentProps } from './component'

const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000
const DEFAULT_TOKEN_LIFETIME_MS = 8 * 60 * 60 * 1000

export class BrokeredGitHubBackend extends GitHubBackend {
  private authUrl: string
  private authClient: AuthClient
  private tokenExpiresAt = 0
  private refreshTimer: ReturnType<typeof setTimeout> | null = null
  private cachedAuthComponent: React.ComponentType<AuthComponentProps> | null = null

  constructor(config: unknown, options?: unknown) {
    super(config, options)
    const raw = process.env.CMS_AUTH_URL
    if (!raw) throw new Error('BrokeredGitHubBackend: CMS_AUTH_URL is not set')
    let parsed: URL
    try {
      parsed = new URL(raw)
    } catch {
      throw new Error(`BrokeredGitHubBackend: CMS_AUTH_URL is not a valid URL: ${raw}`)
    }
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      throw new Error(`BrokeredGitHubBackend: CMS_AUTH_URL must be https (or localhost): ${raw}`)
    }
    this.authUrl = raw.replace(/\/$/, '')
    this.authClient = createAuthClient({
      baseURL: this.authUrl,
      basePath: '/auth',
      credentials: 'include',
      plugins: [genericOAuthClient()],
    }) as AuthClient
  }

  authComponent(): React.ComponentType<AuthComponentProps> {
    if (this.cachedAuthComponent) return this.cachedAuthComponent
    this.cachedAuthComponent = makeCmsLogin(this.authUrl, this.authClient)
    return this.cachedAuthComponent
  }

  async authenticate(credentials: { token: string; expires_in?: number; [key: string]: unknown }): Promise<unknown> {
    const result = await super.authenticate({ token: credentials.token })
    this.tokenExpiresAt = Date.now() + (credentials.expires_in ?? DEFAULT_TOKEN_LIFETIME_MS / 1000) * 1000
    this.scheduleRefresh()
    return result
  }

  async restoreUser(_user: unknown): Promise<unknown> {
    const result = await probeCmsToken(this.authUrl)
    if (result.kind !== 'token') throw new Error('Restore needs interactive sign-in')
    return this.authenticate({ token: result.data.access_token, expires_in: result.data.expires_in })
  }

  async logout(): Promise<unknown> {
    try { await this.authClient.signOut() } catch { /* continue tearing down */ }
    if (this.refreshTimer) clearTimeout(this.refreshTimer)
    this.refreshTimer = null
    this.tokenExpiresAt = 0
    const parentLogout = (super.logout as (() => Promise<unknown>) | undefined)
    if (parentLogout) await parentLogout.call(this)
    window.location.reload()
    return undefined
  }

  private scheduleRefresh(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer)
    const delay = Math.max(0, this.tokenExpiresAt - Date.now() - REFRESH_BEFORE_EXPIRY_MS)
    this.refreshTimer = setTimeout(() => void this.silentRefresh(), delay)
  }

  private async silentRefresh(): Promise<void> {
    try {
      const result = await probeCmsToken(this.authUrl)
      if (result.kind !== 'token') return
      await super.authenticate({ token: result.data.access_token })
      this.tokenExpiresAt = Date.now() + (result.data.expires_in || DEFAULT_TOKEN_LIFETIME_MS / 1000) * 1000
      this.scheduleRefresh()
    } catch (e) {
      // Don't throw — next API call will 401 and force re-auth — but log so
      // operators can spot a refresh storm or a persistent backend failure.
      console.warn('[BrokeredGitHubBackend] silent refresh failed:', e)
    }
  }
}
