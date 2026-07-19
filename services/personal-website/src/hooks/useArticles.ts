import { useStaticQuery, graphql } from "gatsby"
import { type Article } from "../lib/weeknotes"

export default function useArticles(): Article[] {
  const data = useStaticQuery<{ posts: { nodes: Article[] } }>(graphql`
    query Articles {
      posts: allContent(
        sort: { date: DESC }
        filter: { type: { eq: "article" } }
        limit: 1000
      ) {
        nodes {
          contentId
          slug
          date
          title
          topics {
            topicId
            topic
            slug
          }
        }
      }
    }
  `)

  return data.posts.nodes
}
