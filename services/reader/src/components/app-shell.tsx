import React from "react"
import { Outlet, ScrollRestoration, useNavigation } from "react-router-dom"

import { AppLayout } from "./app-layout"

export function AppShell() {
  const navigation = useNavigation()
  return (
    <AppLayout>
      {navigation.state === "loading" && <PendingBar />}
      <Outlet />
      <ScrollRestoration />
    </AppLayout>
  )
}

export function Loading() {
  return (
    <AppLayout>
      <div className="reader-status">
        <p>Loading…</p>
      </div>
    </AppLayout>
  )
}

function PendingBar() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        insetInline: 0,
        top: 0,
        height: 3,
        background: "#4c8bf5",
        zIndex: 1000,
      }}
    />
  )
}
