import React, { useEffect, useReducer } from 'react'
import type { createAuthClient } from 'better-auth/client'
import type { genericOAuthClient } from 'better-auth/client/plugins'
import { AuthenticationPage } from 'decap-cms-ui-default'
import { reducer, initialState, type Action } from './state'
import { probeCmsToken, RoleDeniedError, type CmsTokenResult } from './client'
import { pendingCallbackURL, startedFromPending } from './routes'

export type AuthClient = ReturnType<typeof createAuthClient<{
  baseURL: string
  plugins: [ReturnType<typeof genericOAuthClient>]
}>>

export type AuthComponentProps = {
  onLogin: (credentials: Record<string, unknown>) => void
  error?: string
  clearHash?: () => void
}

interface EffectCtx {
  authUrl: string
  authClient: AuthClient
  clearHash?: () => void
  onLogin: (credentials: Record<string, unknown>) => void
  dispatch: (action: Action) => void
  cancelled: () => boolean
}

// Anywhere we'd hand control to a URL the auth worker returned, gate on a
// scheme + hostname allowlist first. better-auth populates these from the
// configured OAuth provider, but a worker bug or compromise shouldn't
// translate into an open redirect — or, worse, a `javascript:` navigation
// that runs script in the CMS origin (the hostname check alone wouldn't
// catch `javascript://github.com/%0A...`).
const TRUSTED_NAVIGATION_HOSTS = new Set(['github.com'])
const TRUSTED_NAVIGATION_PROTOCOLS = new Set(['https:'])

function safeNavigate(rawUrl: unknown): boolean {
  if (typeof rawUrl !== 'string') return false
  let parsed: URL
  try { parsed = new URL(rawUrl) } catch { return false }
  if (!TRUSTED_NAVIGATION_PROTOCOLS.has(parsed.protocol)) {
    console.error(`[BrokeredGitHubBackend] refused to navigate with untrusted scheme: ${parsed.protocol}`)
    return false
  }
  if (!TRUSTED_NAVIGATION_HOSTS.has(parsed.hostname)) {
    console.error(`[BrokeredGitHubBackend] refused to navigate to untrusted host: ${parsed.hostname}`)
    return false
  }
  window.location.href = parsed.href
  return true
}

async function followLink(providerId: string, ctx: EffectCtx): Promise<void> {
  const { data, error: linkErr } = await ctx.authClient.oauth2.link({
    providerId,
    callbackURL: pendingCallbackURL(),
  })
  if (ctx.cancelled()) return
  if (linkErr) {
    ctx.dispatch({ type: 'fail', message: linkErr.message ?? 'Link failed' })
    return
  }
  if (!safeNavigate((data as { url?: unknown } | null)?.url)) {
    ctx.dispatch({ type: 'fail', message: 'Link returned an unexpected redirect target.' })
  }
}

async function runBootstrap(ctx: EffectCtx): Promise<void> {
  try {
    const result = await probeCmsToken(ctx.authUrl)
    if (ctx.cancelled()) return
    if (result.kind === 'token') {
      ctx.dispatch({ type: 'tokenReady', token: result.data })
      return
    }
    ctx.dispatch({ type: 'noSessionToBroker' })
  } catch (e) {
    if (ctx.cancelled()) return
    if (e instanceof RoleDeniedError) {
      ctx.dispatch({ type: 'fail', message: e.message })
      return
    }
    ctx.dispatch({ type: 'noSessionToBroker' })
  }
}

async function runResume(ctx: EffectCtx): Promise<void> {
  try {
    const result = await probeCmsToken(ctx.authUrl)
    if (ctx.cancelled()) return
    if (result.kind === 'token') {
      ctx.dispatch({ type: 'tokenReady', token: result.data })
      return
    }
    await followLink(result.providerId, ctx)
  } catch (e) {
    if (!ctx.cancelled()) ctx.dispatch({ type: 'fail', message: (e as Error).message })
  }
}

async function runRedirecting(ctx: EffectCtx): Promise<void> {
  try {
    const result = await probeCmsToken(ctx.authUrl)
    if (ctx.cancelled()) return
    if (result.kind === 'token') {
      ctx.dispatch({ type: 'tokenReady', token: result.data })
      return
    }
    await followLink(result.providerId, ctx)
    return
  } catch (e) {
    if (ctx.cancelled()) return
    if (e instanceof RoleDeniedError) {
      ctx.dispatch({ type: 'fail', message: e.message })
      return
    }
  }

  const { data, error: signInErr } = await ctx.authClient.signIn.social({
    provider: 'github',
    callbackURL: pendingCallbackURL(),
  })
  if (ctx.cancelled()) return
  if (signInErr) {
    ctx.dispatch({ type: 'fail', message: signInErr.message ?? 'Sign-in failed' })
    return
  }
  if (!safeNavigate((data as { url?: unknown } | null)?.url)) {
    ctx.dispatch({ type: 'fail', message: 'Sign-in returned an unexpected redirect target.' })
  }
}

function runHandoff(token: CmsTokenResult, ctx: EffectCtx): void {
  // clearHash before onLogin: any incidental hashchange must settle before
  // Decap re-renders against the new credentials.
  ctx.clearHash?.()
  ctx.onLogin({
    token: token.access_token,
    provider: 'github',
    expires_in: token.expires_in,
  })
}

export function makeCmsLogin(
  authUrl: string,
  authClient: AuthClient,
): React.ComponentType<AuthComponentProps> {
  return function CmsLogin({ onLogin, clearHash, error }: AuthComponentProps) {
    const [state, dispatch] = useReducer(
      reducer,
      undefined,
      () => initialState(startedFromPending()),
    )

    useEffect(() => {
      let cancelled = false
      const ctx: EffectCtx = { authUrl, authClient, clearHash, onLogin, dispatch, cancelled: () => cancelled }
      switch (state.kind) {
        case 'bootstrap':   void runBootstrap(ctx); break
        case 'probing':     void runResume(ctx); break
        case 'redirecting': void runRedirecting(ctx); break
        case 'handingOff':  runHandoff(state.token, ctx); break
      }
      return () => { cancelled = true }
    }, [state])

    const onPrimary = state.kind === 'error'
      ? () => dispatch({ type: 'retry' })
      : () => dispatch({ type: 'signIn' })
    const buttonLabel = (() => {
      switch (state.kind) {
        case 'bootstrap': return 'Checking sign-in…'
        case 'idle': return 'Sign in'
        case 'error': return 'Try again'
        case 'handingOff': return 'Loading the editor…'
        default: return 'Signing in…'
      }
    })()
    const errorMessage =
      state.kind === 'error' ? state.message :
      state.kind === 'idle' ? error :
      undefined
    const disabled = state.kind !== 'idle' && state.kind !== 'error'

    return React.createElement(AuthenticationPage, {
      onLogin: onPrimary,
      loginDisabled: disabled,
      loginErrorMessage: errorMessage,
      renderButtonContent: () => buttonLabel,
      t: (k: string) => k,
    })
  }
}
