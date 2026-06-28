import React, { type ReactNode } from "react"
import { Link as RouterLink, useLocation } from "react-router-dom"

import { LinkContext } from "@alexwilson/ds-legacy-components/src/link"
import Header from "@alexwilson/ds-legacy-components/src/header"
import Footer from "@alexwilson/ds-legacy-components/src/footer"
import "../scss/main.scss"

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const nav = [
    { url: "/", label: "Home", active: location.pathname === "/" },
    { url: "/feeds", label: "Feeds", active: location.pathname.startsWith("/feed") },
  ]
  return (
    <LinkContext.Provider value={RouterLink}>
      <Header location={location} compact nav={nav} />
      <main>{children}</main>
      <Footer />
    </LinkContext.Provider>
  )
}
