import React from "react"
import { graphql, PageProps } from "gatsby"

import ArticleCard from "@alexwilson/ds-legacy-components/src/article-card"
import Header from "@alexwilson/ds-legacy-components/src/header"
import HomeLayout, {
  HomeSection,
  HomeTilestack,
  HomeTilestackItem,
} from "@alexwilson/ds-legacy-components/src/home-layout"
import Layout from "../components/layout"
import SEO from "../components/seo"

type ContentNode = {
  contentId: string
  title: string
  url: string
  slug: string
  date: string
  content: { excerpt: string } | null
}

type FourOhFourData = {
  allButWeeknotesAndLists: { nodes: ContentNode[] }
  onlyWeeknotes: { nodes: ContentNode[] }
  onlyLists: { nodes: ContentNode[] }
}

const NotFoundPage = ({ data, location }: PageProps<FourOhFourData>) => {
  const nodes = [
    ...data.allButWeeknotesAndLists.nodes,
    ...data.onlyWeeknotes.nodes,
    ...data.onlyLists.nodes,
  ]

  return (
    <Layout location={location}>
      <Header location={location} compact />
      <HomeLayout>
        <h1 className="heading heading--large">Page Not Found</h1>
        {nodes.length > 0 && (
          <>
            <p>
              Sorry, but that page could not be found, it was either moved,
              deleted or hasn't been written yet! Here's what I've been writing
              recently:
            </p>
            <HomeSection>
              <HomeTilestack>
                {nodes.map((node) => (
                  <HomeTilestackItem key={node.contentId}>
                    <ArticleCard
                      article={node}
                      withImage={false}
                      withDate={false}
                    />
                  </HomeTilestackItem>
                ))}
              </HomeTilestack>
            </HomeSection>
          </>
        )}
      </HomeLayout>
    </Layout>
  )
}

export const query = graphql`
  fragment FourOhFourContent on MarkdownRemark {
    excerpt
  }

  query {
    allButWeeknotesAndLists: allContent(
      sort: { date: DESC }
      filter: {
        topics: { elemMatch: { topic: { nin: ["weeknotes", "lists"] } } }
      }
      limit: 1
    ) {
      nodes {
        contentId
        title
        url
        slug
        date
        content: parent {
          ...FourOhFourContent
        }
      }
    }
    onlyWeeknotes: allContent(
      sort: { date: DESC }
      filter: { topics: { elemMatch: { topic: { eq: "weeknotes" } } } }
      limit: 1
    ) {
      nodes {
        contentId
        title
        url
        slug
        date
        content: parent {
          ...FourOhFourContent
        }
      }
    }
    onlyLists: allContent(
      sort: { date: DESC }
      filter: { topics: { elemMatch: { topic: { eq: "lists" } } } }
      limit: 1
    ) {
      nodes {
        contentId
        title
        url
        slug
        date
        content: parent {
          ...FourOhFourContent
        }
      }
    }
  }
`

export default NotFoundPage

export const Head = () => <SEO title="404: Not found" />
