import { useCallback, useState } from "react"

const READ_STORAGE_KEY = "reader:read"

const load = (): Set<string> => {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(READ_STORAGE_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

const persist = (ids: Set<string>) => {
  if (typeof window === "undefined") return
  window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids]))
}

// Per-entry read state, shared across the firehose and per-feed pages via
// localStorage (keyed on the stable entry id).
export function useReadState() {
  const [readIds, setReadIds] = useState<Set<string>>(load)

  const setRead = useCallback((id: string, read: boolean) => {
    setReadIds((prev) => {
      const next = new Set(prev)
      if (read) next.add(id)
      else next.delete(id)
      persist(next)
      return next
    })
  }, [])

  const markRead = useCallback((ids: Iterable<string>) => {
    setReadIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) next.add(id)
      persist(next)
      return next
    })
  }, [])

  return { readIds, setRead, markRead }
}
