const store = new Map<string, unknown>()

// Stale-while-revalidate, keyed per endpoint — so the manifest is fetched once
// and shared across views, and revisits are instant.
export async function swr<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as T | undefined
  if (hit !== undefined) {
    void fetcher()
      .then((fresh) => store.set(key, fresh))
      .catch(() => {})
    return hit
  }
  const fresh = await fetcher()
  store.set(key, fresh)
  return fresh
}

export function invalidate(key: string): void {
  store.delete(key)
}
