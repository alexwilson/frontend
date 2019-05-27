/**
 * Layout component that queries for data
 * with Gatsby's StaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/static-query/
 */

import React from "react"
import PropTypes from "prop-types"
import { StaticQuery, graphql } from "gatsby"

import Header from "./header"
import "../scss/main.scss"

const Layout = ({ location, children, headerImage=null }) => (
  <StaticQuery
    query={graphql`
      query SiteTitleQuery {
        site {
          siteMetadata {
            title
          }
        }
      }
    `}
    render={data => (
      <>
        <Header siteTitle={data.site.siteMetadata.title} location={location} image={headerImage} />
        <main>{children}</main>
        <footer className="footer">
            <div className="container align-center">
                <span className="text-muted">
                &copy; Alex Wilson {new Date().getFullYear()}
                </span>
            </div>
        </footer>
      </>
    )}
  />
)

// Layout.propTypes = {
//   children: PropTypes.node.isRequired,
// }

export default Layout
