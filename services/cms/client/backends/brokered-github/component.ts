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

// Origin, not hostname: `javascript://github.com/…` parses with hostname
// "github.com" but origin "null" (opaque schemes).
const TRUSTED_NAVIGATION_ORIGINS = new Set(['https://github.com'])

export function safeNavigate(rawUrl: unknown): boolean {
  if (typeof rawUrl !== 'string') return false
  let parsed: URL
  try { parsed = new URL(rawUrl) } catch { return false }
  if (!TRUSTED_NAVIGATION_ORIGINS.has(parsed.origin)) {
    console.error(`[BrokeredGitHubBackend] refused to navigate to untrusted origin: ${parsed.origin}`)
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

interface ProbePolicy {
  onLink: (providerId: string) => void | Promise<void>
  onOtherError: (e: Error) => void | Promise<void>
}

async function probeAndAdvance(ctx: EffectCtx, policy: ProbePolicy): Promise<void> {
  try {
    const result = await probeCmsToken(ctx.authUrl)
    if (ctx.cancelled()) return
    if (result.kind === 'token') {
      ctx.dispatch({ type: 'tokenReady', token: result.data })
      return
    }
    await policy.onLink(result.providerId)
  } catch (e) {
    if (ctx.cancelled()) return
    if (e instanceof RoleDeniedError) {
      ctx.dispatch({ type: 'fail', message: e.message })
      return
    }
    await policy.onOtherError(e as Error)
  }
}

function runBootstrap(ctx: EffectCtx): Promise<void> {
  const noSession = () => ctx.dispatch({ type: 'noSessionToBroker' })
  return probeAndAdvance(ctx, { onLink: noSession, onOtherError: noSession })
}

function runResume(ctx: EffectCtx): Promise<void> {
  return probeAndAdvance(ctx, {
    onLink: (id) => followLink(id, ctx),
    onOtherError: (e) => ctx.dispatch({ type: 'fail', message: e.message }),
  })
}

function runRedirecting(ctx: EffectCtx): Promise<void> {
  return probeAndAdvance(ctx, {
    onLink: (id) => followLink(id, ctx),
    onOtherError: () => runFreshOAuth(ctx),
  })
}

async function runFreshOAuth(ctx: EffectCtx): Promise<void> {
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
