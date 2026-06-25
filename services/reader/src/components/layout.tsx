import React, { ReactNode } from "react"
import { Link as GatsbyLink } from "gatsby"

import { LinkContext } from "@alexwilson/ds-legacy-components/src/link"
import Header from "@alexwilson/ds-legacy-components/src/header"
import Footer from "@alexwilson/ds-legacy-components/src/footer"
import "../scss/main.scss"

type LayoutProps = {
  location?: Location
  children: ReactNode
}

const Layout = ({ location, children }: LayoutProps) => (
  <LinkContext.Provider value={GatsbyLink}>
    <Header location={location} compact />
    <main>{children}</main>
    <Footer />
  </LinkContext.Provider>
)

export default Layout
