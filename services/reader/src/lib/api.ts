import { ensureToken } from "./auth"
import type { FeedEntry } from "./entries"

const API_BASE = "/reader/api"

export type LatestPost = { title: string | null; publishedAt: string | null }

export type Feed = {
  id: string
  title: string
  folders: string[]
  count: number
  postsPerWeek: number | null
  medianIntervalDays: number | null
  updatedAt: string | null
  latestPost: LatestPost | null
}

export type River = { generatedAt: string | null; entries: FeedEntry[] }
export type Index = { generatedAt: string | null; feeds: Feed[] }

export class Unauthorized extends Error {
  constructor() {
    super("unauthorized")
  }
}

async function getJson<T>(path: string): Promise<T> {
  const token = await ensureToken()
  const res = await fetch(`${API_BASE}/${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (res.status === 401) throw new Unauthorized()
  if (!res.ok) throw new Error(`reader api ${path}: ${res.status}`)
  return (await res.json()) as T
}

export const getRiver = () => getJson<River>("river")
export const getIndex = () => getJson<Index>("index")
export const getFeed = (id: string) => getJson<FeedEntry[]>(`feeds/${encodeURIComponent(id)}`)
