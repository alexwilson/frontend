import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { readRequestedScope, type ScopeRequest } from '../app-token'

// Exercises Hono's real request/body parsing without needing D1 or better-auth.
function makeApp() {
  const app = new Hono()
  app.all('/test', async (c) => {
    const result = await readRequestedScope(c as never)
    return c.json(result)
  })
  return app
}

async function call(init?: RequestInit, path = '/test'): Promise<ScopeRequest> {
  const res = await makeApp().request(path, init)
  return (await res.json()) as ScopeRequest
}

describe('readRequestedScope — absent', () => {
  it('GET with no scope param', async () => {
    expect(await call()).toEqual({ kind: 'absent' })
  })

  it('POST without a body', async () => {
    expect(await call({ method: 'POST' })).toEqual({ kind: 'absent' })
  })

  it('POST JSON without scope key', async () => {
    expect(
      await call({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ other: 'thing' }),
      }),
    ).toEqual({ kind: 'absent' })
  })

  it('POST form without scope field', async () => {
    expect(
      await call({
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'other=thing',
      }),
    ).toEqual({ kind: 'absent' })
  })
})

describe('readRequestedScope — parsed', () => {
  it('GET with ?scope=cms:read', async () => {
    expect(await call(undefined, '/test?scope=cms:read')).toEqual({
      kind: 'parsed',
      scopes: ['cms:read'],
    })
  })

  it('GET with empty ?scope= → parsed empty (NOT absent; caller will 403)', async () => {
    expect(await call(undefined, '/test?scope=')).toEqual({
      kind: 'parsed',
      scopes: [],
    })
  })

  it('POST JSON with scope', async () => {
    expect(
      await call({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scope: 'cms:read cms:write' }),
      }),
    ).toEqual({ kind: 'parsed', scopes: ['cms:read', 'cms:write'] })
  })

  it('POST form with scope', async () => {
    expect(
      await call({
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'scope=cms:read',
      }),
    ).toEqual({ kind: 'parsed', scopes: ['cms:read'] })
  })

  it('POST JSON with explicit empty-string scope → parsed empty', async () => {
    expect(
      await call({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scope: '' }),
      }),
    ).toEqual({ kind: 'parsed', scopes: [] })
  })
})

describe('readRequestedScope — invalid', () => {
  it('POST with malformed JSON → 400', async () => {
    const result = await call({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not-json',
    })
    expect(result).toEqual({
      kind: 'invalid',
      status: 400,
      reason: 'request body is malformed',
    })
  })

  it('POST JSON with non-string scope (array) → 400', async () => {
    const result = await call({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scope: ['cms:read', 'cms:write'] }),
    })
    expect(result).toEqual({
      kind: 'invalid',
      status: 400,
      reason: 'scope must be a string',
    })
  })

  it('POST JSON with non-string scope (number) → 400', async () => {
    const result = await call({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scope: 42 }),
    })
    expect(result).toEqual({
      kind: 'invalid',
      status: 400,
      reason: 'scope must be a string',
    })
  })

  it('POST with content-length exceeding limit → 413', async () => {
    const oversized = 'a'.repeat(5000)
    const result = await call({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(oversized.length),
      },
      body: oversized,
    })
    expect(result).toEqual({
      kind: 'invalid',
      status: 413,
      reason: 'request body exceeds limit',
    })
  })
})
