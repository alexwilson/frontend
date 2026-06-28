const TOKEN_URL = "https://alexwilson.tech/auth/token"
const SIGN_IN_URL = "https://alexwilson.tech/auth/sign-in/social"
const STALE_MS = 10 * 60_000

let token: string | null = null
let fetchedAt = 0

async function mint(): Promise<string | null> {
  try {
    const res = await fetch(TOKEN_URL, { credentials: "include" })
    if (res.ok) return ((await res.json()) as { token?: string }).token ?? null
  } catch {
    // unreachable / signed out
  }
  return null
}

export async function ensureToken(): Promise<string | null> {
  if (!token || Date.now() - fetchedAt > STALE_MS) {
    token = await mint()
    fetchedAt = Date.now()
  }
  return token
}

export async function refreshToken(): Promise<string | null> {
  token = await mint()
  fetchedAt = Date.now()
  return token
}

export async function signIn(): Promise<void> {
  const res = await fetch(SIGN_IN_URL, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "github", callbackURL: window.location.href }),
  })
  const { url } = (await res.json()) as { url?: string }
  if (!url) throw new Error("sign-in: no redirect url")
  window.location.href = url
}
