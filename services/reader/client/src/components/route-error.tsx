import React from "react"
import { useRouteError } from "react-router-dom"

import { Unauthorized } from "../lib/api"
import { SignedOut } from "./signed-out"

export function RouteError() {
  const error = useRouteError()
  if (error instanceof Unauthorized) return <SignedOut />
  return <p className="reader-status">Couldn’t load this page.</p>
}
