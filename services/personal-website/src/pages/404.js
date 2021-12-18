import React from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"

const NotFoundPage = ({location}) => (
  <Layout location={location}>
    <SEO title="404: Not found" />
    <h1 className="heading heading--large">Content not found.</h1>
    <h2 className="heading">The content or page you are trying to access can't be found. It may have been renamed, moved or deleted.</h2>
  </Layout>
)

export default NotFoundPage
