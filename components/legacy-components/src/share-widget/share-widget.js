import React from 'react'
import twitterUrl from '@alexwilson/ds-icons/twitter.svg'
import blueskyUrl from '@alexwilson/ds-icons/bluesky.svg'
import linkedinUrl from '@alexwilson/ds-icons/linkedin.svg'
import redditUrl from '@alexwilson/ds-icons/reddit.svg'

const ShareWidget = ({url, title}) => (
  <div className="alex-share">
    <h3 className="share">Share</h3>
    <ul>
      <li>
        <a href={`https://twitter.com/intent/tweet?url=${url}&amp;text=${title}&amp;related=AlexWilsonV1&amp;via=AlexWilsonV1`}>
          <img src={twitterUrl} alt="Twitter" title="Share on Twitter" />
        </a>
      </li>
      <li>
        <a href={`https://bsky.app/intent/compose?text=${title}%0A${url}`}>
          <img src={blueskyUrl} alt="Bluesky" title="Share on Bluesky" />
        </a>
      </li>
      <li>
        <a href={`http://www.linkedin.com/shareArticle?mini=true&amp;url=${url}&amp;title=${title}`}>
          <img src={linkedinUrl} alt="LinkedIn" title="Share on LinkedIn" />
        </a>
      </li>
      <li>
        <a href={`http://reddit.com/submit?url=${url}&amp;title=${title}`}>
          <img src={redditUrl} alt="Reddit" title="Share on Reddit" />
        </a>
      </li>
    </ul>
  </div>
)

export default ShareWidget
