import React, { Component } from "react"
import ResponsiveImage from "../responsive-image"

type WebmentionAuthor = {
  url: string
  name: string
  photo: string
}

type Webmention = {
  'wm-id': number
  'wm-property': string
  author: WebmentionAuthor
}

const webmentionExtractor = (wmProperty: string) => (mention: Webmention) =>
  mention["wm-property"] === wmProperty
const likesFromWebmentions = (webmentions: Webmention[]) =>
  webmentions.filter(webmentionExtractor("like-of"))
const mentionsFromWebmentions = (webmentions: Webmention[]) =>
  webmentions.filter(webmentionExtractor("mention-of"))
const repostsFromWebmentions = (webmentions: Webmention[]) =>
  webmentions.filter(webmentionExtractor("repost-of"))
const repliesFromWebmentions = (webmentions: Webmention[]) =>
  webmentions.filter(webmentionExtractor("reply-of"))

type FaceProps = { webmention: Webmention }

function Face({ webmention }: FaceProps) {
  return (
    <a href={webmention.author.url} title={webmention.author.name}>
      <ResponsiveImage
        src={webmention.author.photo}
        width={64}
        height={64}
        quality={"lossless"}
        format={"png"}
      />
    </a>
  )
}

type FacestackProps = { webmentions: Webmention[] }

function Facestack({ webmentions }: FacestackProps) {
  return (
    <ul>
      {webmentions.map((webmention) => (
        <li key={webmention["wm-id"]}>
          <Face webmention={webmention} />
        </li>
      ))}
    </ul>
  )
}

type WebmentionsProps = {
  contentId?: string
  url?: string
  urls?: string[]
}

type WebmentionsState = {
  error: Error | null
  isLoaded: boolean
  mentions: Webmention[]
  reposts: Webmention[]
  replies: Webmention[]
  likes: Webmention[]
}

export default class Webmentions extends Component<WebmentionsProps, WebmentionsState> {
  constructor(props: WebmentionsProps) {
    super(props)
    this.state = {
      error: null,
      isLoaded: false,
      mentions: [],
      reposts: [],
      replies: [],
      likes: [],
    }
  }

  /** @deprecated */
  async fetchWebmentions(urls: string[]) {
    const webmentions = await Promise.all(
      urls.map((url) =>
        fetch(`https://webmention.io/api/mentions.jf2?target=${url}`)
          .then((res) => res.json())
          .then((feed) => feed.children as Webmention[]),
      ),
    )
      .then((responses) =>
        responses.reduce((all, fragment) => all.concat(fragment), [] as Webmention[]),
      )
      .catch(console.error)

    if (webmentions) {
      this.setState({
        reposts: repostsFromWebmentions(webmentions),
        mentions: mentionsFromWebmentions(webmentions),
        likes: likesFromWebmentions(webmentions),
        replies: repliesFromWebmentions(webmentions),
      })
    }
  }

  async fetchWebmentionsByContentId(contentId: string) {
    try {
      const request = await fetch(
        `https://webmentions.alexwilson.tech/v1/webmention/${contentId}`,
      )

      if (!request.ok) {
        return
      }

      const { children: webmentions } = await request.json() as { children?: Webmention[] }

      if (webmentions) {
        this.setState({
          reposts: repostsFromWebmentions(webmentions),
          mentions: mentionsFromWebmentions(webmentions),
          likes: likesFromWebmentions(webmentions),
          replies: repliesFromWebmentions(webmentions),
        })
      }
    } catch {}
  }

  componentDidMount() {
    if (this.props.contentId) {
      this.fetchWebmentionsByContentId(this.props.contentId)
      return
    }

    // Legacy behaviour.
    const urls = this.props.urls ? [...this.props.urls] : []
    if (this.props.url) {
      urls.push(this.props.url)
    }
    if (urls.length > 0) {
      this.fetchWebmentions(urls)
    }
  }

  render() {
    const { likes, reposts } = this.state

    const hasLikes = likes.length > 0
    const hasReposts = reposts.length > 0

    return this.state.isLoaded === false ? null : (
      <div className="alex-webmentions">
        {!hasLikes ? null : (
          <div className="alex-webmentions__likes">
            <h3>Likes</h3>
            <Facestack webmentions={likes} />
          </div>
        )}

        {!hasReposts ? null : (
          <div className="alex-webmentions__reposts">
            <h3>Reposts</h3>
            <Facestack webmentions={reposts} />
          </div>
        )}
      </div>
    )
  }
}
