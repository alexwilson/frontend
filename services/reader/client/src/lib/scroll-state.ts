import type { StateSnapshot } from "react-virtuoso"

const PREFIX = "reader:scroll:"

// Virtuoso scroll snapshots, keyed by the current filter/view so we only restore
// a position for the list it was captured from. sessionStorage survives back-nav
// and reload within the tab.
export const loadSnapshot = (key?: string): StateSnapshot | undefined => {
  if (!key || typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as StateSnapshot) : undefined
  } catch {
    return undefined
  }
}

export const saveSnapshot = (key: string | undefined, snapshot: StateSnapshot) => {
  if (!key || typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(PREFIX + key, JSON.stringify(snapshot))
  } catch {
    /* sessionStorage unavailable/full — non-fatal */
  }
}
