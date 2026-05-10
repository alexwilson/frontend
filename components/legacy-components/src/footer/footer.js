import React from 'react'

const socialLinks = [
  { url: 'https://bsky.app/profile/alexwilson.bsky.social', icon: '/svg/bluesky.svg', title: 'Bluesky' },
  { url: 'https://www.linkedin.com/in/alex-/', icon: '/svg/linkedin.svg', title: 'LinkedIn' },
  { url: 'https://www.instagram.com/alx.946', icon: '/svg/instagram.svg', title: 'Instagram' },
  { url: 'https://mastodon.social/@alexwilson', icon: '/svg/mastodon.svg', title: 'Mastodon' },
  { url: 'https://github.com/alexwilson', icon: '/svg/github.svg', title: 'GitHub' },
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
