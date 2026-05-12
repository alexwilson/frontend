import React from 'react'
import Infobox from '.'

export default {
  title: 'Legacy/Molecules/Infobox',
  component: Infobox,
  parameters: { layout: 'padded' },
}

export const Default = {
  render: () => (
    <Infobox>
      <p><strong>Stay up to date</strong></p>
      <ul>
        <li className="bullet--rss">Subscribe via RSS</li>
        <li className="bullet--email">Subscribe by email</li>
        <li className="bullet--twitter">Follow on Twitter</li>
      </ul>
    </Infobox>
  ),
}

export const TextOnly = {
  render: () => (
    <Infobox>
      <p><strong>Note:</strong> This article was originally published in 2019 and may contain outdated information.</p>
    </Infobox>
  ),
}
