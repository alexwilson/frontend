/**
 * Layout component that queries for data
 * with Gatsby's StaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/static-query/
 */

import React, {Children} from "react"
import PropTypes from "prop-types"
import { OptimizelyProvider, createInstance } from '@optimizely/react-sdk';
const optimizely = createInstance({
  sdkKey: 'AqkL6UF8zHCvc7NCLSxohA',
})

import Header from "./header"
import Footer from "./footer"
import "../scss/main.scss"

const Layout = ({ location, children }) => {

  let HeaderElement = <Header location={location} />
  let FooterElement = <Footer />

  const layoutChildren = Children.toArray(children)
    .filter(child => {

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
      <>
      <OptimizelyProvider optimizely={optimizely}>
        {HeaderElement}
        <main>{layoutChildren}</main>
        {FooterElement}
      </OptimizelyProvider>
      </>
    )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
