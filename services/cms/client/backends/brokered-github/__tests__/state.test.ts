import { describe, it, expect } from 'vitest'
import { reducer, initialState, type State } from '../state'
import type { CmsTokenResult } from '../client'

const token: CmsTokenResult = {
  jwt: 'header.payload.sig',
  access_token: 'ghu_test',
  scope: 'cms:read cms:write',
  claims: { repository: 'alexwilson/content' },
  expires_in: 900,
}

describe('reducer', () => {
  it('signIn from idle → redirecting', () => {
    expect(reducer({ kind: 'idle' }, { type: 'signIn' }))
      .toEqual({ kind: 'redirecting' })
  })

  it('tokenReady from probing → handingOff carries token', () => {
    expect(reducer({ kind: 'probing' }, { type: 'tokenReady', token }))
      .toEqual({ kind: 'handingOff', token })
  })

  it('fail from any state → error carries message', () => {
    const starts: State[] = [
      { kind: 'idle' },
      { kind: 'redirecting' },
      { kind: 'probing' },
      { kind: 'handingOff', token },
    ]
    for (const start of starts) {
      expect(reducer(start, { type: 'fail', message: 'boom' }))
        .toEqual({ kind: 'error', message: 'boom' })
    }
  })

  it('retry from error → idle', () => {
    expect(reducer({ kind: 'error', message: 'boom' }, { type: 'retry' }))
      .toEqual({ kind: 'idle' })
  })

  it('transitions are unconditional — current state does not block', () => {
    expect(reducer({ kind: 'handingOff', token }, { type: 'fail', message: 'late' }))
      .toEqual({ kind: 'error', message: 'late' })
  })
})

describe('initialState', () => {
  it('resumeFromOAuth=true → probing', () => {
    expect(initialState(true)).toEqual({ kind: 'probing' })
  })

  it('resumeFromOAuth=false → bootstrap', () => {
    expect(initialState(false)).toEqual({ kind: 'bootstrap' })
  })
})

describe('reducer: bootstrap transitions', () => {
  it('tokenReady from bootstrap → handingOff', () => {
    expect(reducer({ kind: 'bootstrap' }, { type: 'tokenReady', token }))
      .toEqual({ kind: 'handingOff', token })
  })

  it('noSessionToBroker from bootstrap → idle', () => {
    expect(reducer({ kind: 'bootstrap' }, { type: 'noSessionToBroker' }))
      .toEqual({ kind: 'idle' })
  })
})
