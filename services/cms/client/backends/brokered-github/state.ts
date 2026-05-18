import type { CmsTokenResult } from './client'

export type State =
  | { kind: 'bootstrap' }
  | { kind: 'idle' }
  | { kind: 'redirecting' }
  | { kind: 'probing' }
  | { kind: 'handingOff'; token: CmsTokenResult }
  | { kind: 'error'; message: string }

export type Action =
  | { type: 'signIn' }
  | { type: 'tokenReady'; token: CmsTokenResult }
  | { type: 'fail'; message: string }
  | { type: 'retry' }
  | { type: 'noSessionToBroker' }

export const reducer = (_state: State, action: Action): State => {
  switch (action.type) {
    case 'signIn': return { kind: 'redirecting' }
    case 'tokenReady': return { kind: 'handingOff', token: action.token }
    case 'fail': return { kind: 'error', message: action.message }
    case 'retry': return { kind: 'idle' }
    case 'noSessionToBroker': return { kind: 'idle' }
  }
}

export const initialState = (resumeFromOAuth: boolean): State =>
  resumeFromOAuth ? { kind: 'probing' } : { kind: 'bootstrap' }
