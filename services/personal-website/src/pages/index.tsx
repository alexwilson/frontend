import React from "react"
import { graphql, PageProps } from "gatsby"

import ArticleCard from "@alexwilson/ds-legacy-components/src/article-card"
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

type IndexData = {
  allButWeeknotesAndLists: { nodes: ContentNode[] }
  onlyWeeknotes: { nodes: ContentNode[] }
  onlyLists: { nodes: ContentNode[] }
}

const IndexPage = ({ data, location }: PageProps<IndexData>) => (
  <Layout location={location}>
    <HomeLayout>
      <HomeSection>
        <h2>
          <a className="heading" href="/blog/">
            Latest Writing
          </a>
        </h2>
        <HomeTilestack>
          {data.allButWeeknotesAndLists.nodes.map((node) => (
            <HomeTilestackItem key={node.contentId}>
              <ArticleCard article={node} withImage={false} withDate={false} />
            </HomeTilestackItem>
          ))}
        </HomeTilestack>
      </HomeSection>
      <HomeSection>
        <h2>
          <a className="heading" href="/topic/weeknotes">
            Latest Notes
          </a>
        </h2>
        <HomeTilestack>
          {data.onlyWeeknotes.nodes.map((node) => (
            <HomeTilestackItem key={node.contentId}>
              <ArticleCard article={node} withImage={false} withDate={false} />
            </HomeTilestackItem>
          ))}
        </HomeTilestack>
      </HomeSection>
    </HomeLayout>
  </Layout>
)

export const query = graphql`
  fragment HomepageContent on MarkdownRemark {
    excerpt: excerpt
  }

  query {
    allButWeeknotesAndLists: allContent(
      sort: { fields: [date], order: DESC }
      filter: {
        topics: { elemMatch: { topic: { nin: ["weeknotes", "lists"] } } }
      }
      limit: 3
    ) {
      nodes {
        contentId
        title
        url
        slug
        date
        content: parent {
          ...HomepageContent
        }
      }
    }
    onlyWeeknotes: allContent(
      sort: { fields: [date], order: DESC }
      filter: { topics: { elemMatch: { topic: { eq: "weeknotes" } } } }
      limit: 3
    ) {
      nodes {
        contentId
        title
        url
        slug
        date
        content: parent {
          ...HomepageContent
        }
      }
    }
    onlyLists: allContent(
      sort: { fields: [date], order: DESC }
      filter: { topics: { elemMatch: { topic: { eq: "lists" } } } }
      limit: 3
    ) {
      nodes {
        contentId
        title
        url
        slug
        date
        content: parent {
          ...HomepageContent
        }
      }
    }
  }
`
export default IndexPage

export const Head = () => <SEO title="Home" />
