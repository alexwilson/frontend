import React from 'react'

const ShareWidget = ({url, title}) => (
  <div className="alex-share">
    <ul>
      <li>
        <a href={`https://twitter.com/intent/tweet?url=${url}&amp;text=${title}&amp;related=antoligy&amp;via=antoligy`}>
          <img src="/svg/twitter.svg" title="Share on Twitter" />
        </a>
      </li>
      <li>
        <a href={`http://www.facebook.com/sharer.php?u=${url}&amp;t=${title}`}>
          <img src="/svg/facebook.svg" title="Share on Twitter" />
        </a>
      </li>
      <li>
        <a href={`http://www.linkedin.com/shareArticle?mini=true&amp;url=${url}&amp;title=${title}`}>
          <img src="/svg/linkedin.svg" title="Share on LinkedIn" />
        </a>
      </li>
      <li>
        <a href={`http://reddit.com/submit?url=${url}&amp;title=${title}`}>
          <img src="/svg/reddit.svg" title="Share on Reddit" />
        </a>
      </li>
    </ul>
  </div>
)

export default ShareWidget
