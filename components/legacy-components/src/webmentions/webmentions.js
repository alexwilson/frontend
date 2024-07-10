import fetch from "isomorphic-fetch";
import React, { Component } from "react";
import ResponsiveImage from "../responsive-image";

const webmentionExtractor = (wmProperty) => (mention) =>
  mention["wm-property"] === wmProperty;
const likesFromWebmentions = (webmentions) =>
  webmentions.filter(webmentionExtractor("like-of"));
const mentionsFromWebmentions = (webmentions) =>
  webmentions.filter(webmentionExtractor("mention-of"));
const repostsFromWebmentions = (webmentions) =>
  webmentions.filter(webmentionExtractor("repost-of"));
const repliesFromWebmentions = (webmentions) =>
  webmentions.filter(webmentionExtractor("reply-of"));

function Face({ webmention }) {
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
  );
}

function Facestack({ webmentions }) {
  return (
    <ul>
      {webmentions.map((webmention) => (
        <li key={webmention["wm-id"]}>
          <Face webmention={webmention} />
        </li>
      ))}
    </ul>
  );
}

export default class Webmentions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      mentions: [],
      reposts: [],
      replies: [],
      likes: [],
    };
  }

  /**
   * @deprecated
   */
  async fetchWebmentions(urls) {
    const webmentions = await Promise.all(
      urls.map((url) =>
        fetch(`https://webmention.io/api/mentions.jf2?target=${url}`)
          .then((res) => res.json())
          .then((feed) => feed.children),
      ),
    )
      .then((responses) =>
        responses.reduce((all, fragment) => all.concat(fragment), []),
      )
      .catch(console.error);

    this.setState({
      reposts: repostsFromWebmentions(webmentions),
      mentions: mentionsFromWebmentions(webmentions),
      likes: likesFromWebmentions(webmentions),
      replies: repliesFromWebmentions(webmentions),
    });
  }

  /**
   * Fetch webmentions by content ID.
   * @param {string} contentId
   * @returns {Promise<void>}
   */
  async fetchWebmentionsByContentId(contentId) {
    try {
      const request = await fetch(
        `https://webmentions.alexwilson.tech/v1/webmention/${contentId}`,
      );

      if (!request.ok) {
        return;
      }

      const { children: webmentions } = await request.json();

      if (webmentions) {
        this.setState({
          reposts: repostsFromWebmentions(webmentions),
          mentions: mentionsFromWebmentions(webmentions),
          likes: likesFromWebmentions(webmentions),
          replies: repliesFromWebmentions(webmentions),
        });
      }
    } catch (err) {}
  }

  componentDidMount() {
    if (this.props.contentId) {
      this.fetchWebmentionsByContentId(this.props.contentId);
      return;
    }

    // Legacy behaviour.
    const urls = this.props.urls || [];
    if (this.props.url) {
      urls.push(this.props.url);
    }
    if (urls.length > 0) {
      this.fetchWebmentions(urls);
    }
  }

  render() {
    const { likes, replies, reposts, mentions } = this.state;

    const hasLikes = likes.length > 0;
    const hasReplies = replies.length > 0;
    const hasReposts = reposts.length > 0;
    const hasMentions = mentions.length > 0;

    return this.isLoaded === false ? null : (
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

        {/* <div className="alex-webmentions--comments">
        {[...replies, ...mentions].map(comment =>
            <a key={comment.author.url} href={comment.author.url} title={comment.author.name}>
              <ResponsiveImage src={comment.author.photo} />
              <div __dangerouslySetInnerHTML={{html: comment.content.html}}></div>
            </a>
          )}
        </div> */}
      </div>
    );
  }
}
