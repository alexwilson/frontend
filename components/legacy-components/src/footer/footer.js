import React from 'react'
import blueskyUrl from '@alexwilson/ds-icons/bluesky.svg'
import linkedinUrl from '@alexwilson/ds-icons/linkedin.svg'
import instagramUrl from '@alexwilson/ds-icons/instagram.svg'
import mastodonUrl from '@alexwilson/ds-icons/mastodon.svg'
import githubUrl from '@alexwilson/ds-icons/github.svg'

const socialLinks = [
  { url: 'https://bsky.app/profile/alexwilson.bsky.social', icon: blueskyUrl, title: 'Bluesky' },
  { url: 'https://www.linkedin.com/in/alex-/', icon: linkedinUrl, title: 'LinkedIn' },
  { url: 'https://www.instagram.com/alx.946', icon: instagramUrl, title: 'Instagram' },
  { url: 'https://mastodon.social/@alexwilson', icon: mastodonUrl, title: 'Mastodon' },
  { url: 'https://github.com/alexwilson', icon: githubUrl, title: 'GitHub' },
]

const Footer = () => (
  <footer className="footer">
    <div className="container align-center">
      <span className="text-muted">&copy; Alex Wilson {new Date().getFullYear()}</span>
      <span className="footer__separator"> &bull; </span>
      {socialLinks.map(({ url, icon, title }) => (
        <a key={title} href={url} rel="me" className="footer__social">
          <img src={icon} alt={title} className="footer__social-link" />
        </a>
      ))}
    </div>
  </footer>
)

export default Footer
