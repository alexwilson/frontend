import React, { useState } from "react"

import { signIn } from "../lib/auth"

export function SignedOut() {
  const [pending, setPending] = useState(false)

  const start = async () => {
    setPending(true)
    try {
      await signIn()
    } catch {
      setPending(false)
    }
  }

  return (
    <div className="reader-status reader-signin">
      <button
        type="button"
        className="reader-signin__button"
        onClick={start}
        disabled={pending}
      >
        {pending ? "Redirecting…" : "Sign in"}
      </button>
    </div>
  )
}
