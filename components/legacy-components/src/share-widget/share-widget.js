import React from 'react'

const ShareWidget = ({url, title}) => (
  <div className="alex-share">
    <h3 className="share">Share</h3>
    <ul>
      <li>
        <a href={`https://twitter.com/intent/tweet?url=${url}&amp;text=${title}&amp;related=AlexWilsonV1&amp;via=AlexWilsonV1`}>
          <img src="/svg/twitter.svg" alt="Twitter" title="Share on Twitter" />
        </a>
      </li>
      <li>
        <a href={`http://www.facebook.com/sharer.php?u=${url}&amp;t=${title}`}>
          <img src="/svg/facebook.svg" alt="Facebook" title="Share on Facebook" />
        </a>
      </li>
      <li>
        <a href={`http://www.linkedin.com/shareArticle?mini=true&amp;url=${url}&amp;title=${title}`}>
          <img src="/svg/linkedin.svg" alt="LinkedIn" title="Share on LinkedIn" />
        </a>
      </li>
      <li>
        <a href={`http://reddit.com/submit?url=${url}&amp;title=${title}`}>
          <img src="/svg/reddit.svg" alt="Reddit" title="Share on Reddit" />
        </a>
      </li>
    </ul>
  </div>
)

export default ShareWidget
