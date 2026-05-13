import React, { Children, ReactNode } from "react"
import { Link as GatsbyLink } from "gatsby"

import { LinkContext } from "@alexwilson/ds-legacy-components/src/link"
import Header from "@alexwilson/ds-legacy-components/src/header"
import Footer from "@alexwilson/ds-legacy-components/src/footer"
import "../scss/main.scss"

type LayoutProps = {
  location?: Location
  children: ReactNode
}

const Layout = ({ location, children }: LayoutProps) => {
  let HeaderElement: ReactNode = <Header location={location} />
  let FooterElement: ReactNode = <Footer />

  const layoutChildren = Children.toArray(children).filter((child: any) => {
    if (child.type === Header || Header.isPrototypeOf(child.type)) {
      HeaderElement = child
      return false
    }

    if (child.type === Footer || Footer.isPrototypeOf(child.type)) {
      FooterElement = child
      return false
    }

    return true
  })

  return (
    <LinkContext.Provider value={GatsbyLink}>
      {HeaderElement}
      <main>{layoutChildren}</main>
      {FooterElement}
    </LinkContext.Provider>
  )
}

export default Layout
