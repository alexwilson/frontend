import React from 'react'

import Bluesky   from '../bluesky.svg'
import Email     from '../email.svg'
import Facebook  from '../facebook.svg'
import Github    from '../github.svg'
import Instagram from '../instagram.svg'
import LinkedIn  from '../linkedin.svg'
import Mastodon  from '../mastodon.svg'
import Reddit    from '../reddit.svg'
import Rss       from '../rss.svg'
import Twitter   from '../twitter.svg'

const icons = [
  { name: 'bluesky',   src: Bluesky },
  { name: 'email',     src: Email },
  { name: 'facebook',  src: Facebook },
  { name: 'github',    src: Github },
  { name: 'instagram', src: Instagram },
  { name: 'linkedin',  src: LinkedIn },
  { name: 'mastodon',  src: Mastodon },
  { name: 'reddit',    src: Reddit },
  { name: 'rss',       src: Rss },
  { name: 'twitter',   src: Twitter },
]

export default {
  title: 'Icons',
  parameters: { layout: 'padded' },
}

export const Gallery = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1.5rem' }}>
      {icons.map(({ name, src }) => (
        <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <img src={src} alt={name} width={40} height={40} />
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888' }}>{name}</span>
        </div>
      ))}
    </div>
  ),
}
