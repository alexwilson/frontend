import React, { Component } from "react"
import promiseImageLoader from 'promise-image-loader'
import Link from "../link"
import blueskyUrl from '@alexwilson/ds-icons/bluesky.svg'
import linkedinUrl from '@alexwilson/ds-icons/linkedin.svg'
import instagramUrl from '@alexwilson/ds-icons/instagram.svg'
import mastodonUrl from '@alexwilson/ds-icons/mastodon.svg'
import githubUrl from '@alexwilson/ds-icons/github.svg'

type NavItemProps = {
  url: string
  rel?: string
  active?: boolean
  width?: string
  children?: React.ReactNode
}

const NavItem = ({ url, rel, active, width, children }: NavItemProps) => {
  const classList = ["alex-header__nav-item"]
  const isExternal = url.startsWith("http")
  if (active) classList.push("alex-header__nav-item--active")
  if (width) classList.push(`alex-header__nav-item--width-${width}`)
  return (
    <li className={classList.join(' ')}>
      {isExternal
        ? <a href={url} rel={rel}>{children}</a>
        : <Link rel={rel} to={url}>{children}</Link>
      }
    </li>
  )
}

const NavSpacer = () => (
  <li className="alex-header__nav-item alex-header__nav-item--spacer"></li>
)

type IconProps = {
  src: string
  title: string
}

const Icon = ({ src, title }: IconProps) => (
  <img
    src={src}
    alt={title}
    className="large"
    height="1em"
  />
)

type HeaderImageProps = {
  src: string | null
  blur?: boolean
}

type HeaderImageState = {
  preloadedImage: string | undefined
}

class HeaderImage extends Component<HeaderImageProps, HeaderImageState> {
  constructor(props: HeaderImageProps) {
    super(props)
    this.state = {
      preloadedImage: undefined
    }
  }

  preloadImage(_src: string | null) {
    if (!this.props.src) return
    const actualSrc = this.imageService(this.props.src, [
      'quality=high',
      'format=jpg',
      'width=1920'
    ])
    const img = new Image()
    img.src = actualSrc
    promiseImageLoader(img)
      .then(() => this.setState({
        preloadedImage: actualSrc
      }))
      .catch(() => { })
  }

  imageService(url: string, params: string[] = []) {
    return `https://imagecdn.app/v2/image/${encodeURIComponent(url)}?${params.join('&')}`
  }

  render() {
    const { src } = this.props
    return <div className={`alex-header-image`}>
      <picture className={`alex-header-image--container`}>
        <img
          alt="Header"
          className={`alex-header-image__blur`}
          onLoad={this.preloadImage.bind(this, src)}
          src={src !== null ? this.imageService(src, [
            'width=100',
            'height=60',
            'quality=low',
            'format=jpg'
          ]) : undefined} />
        <img
          alt="Header"
          className={`alex-header-image__main`}
          src={this.state.preloadedImage}
          style={{
            opacity: this.props.blur !== true && this.state.preloadedImage !== undefined ? 1 : 0
          }} />
      </picture>
    </div>
  }
}

type NavLink = {
  url: string
  label: React.ReactNode
  active?: boolean
  rel?: string
  width?: string
}

type HeaderProps = {
  image?: string | null
  location?: { pathname: string }
  section?: 'blog' | 'talks' | null
  compact?: boolean
  // Override the default site nav items — e.g. a sub-app like the reader
  // supplying its own. Omitted, the standard site navigation renders.
  nav?: NavLink[]
}

type HeaderState = {
  backgroundImage: string | null
  backgroundImageLoaded: boolean
  navigationExpanded: boolean
}

class Header extends Component<HeaderProps, HeaderState> {
  header: React.RefObject<HTMLElement | null>
  headerNav: React.RefObject<HTMLElement | null>

  constructor(props: HeaderProps) {
    super(props)
    this.header = React.createRef()
    this.headerNav = React.createRef()
    this.state = {
      backgroundImage: props.image ?? null,
      backgroundImageLoaded: false,
      navigationExpanded: false
    }
  }

  componentDidMount() {
    if (this.header.current && this.headerNav.current) {
      const navHeight = this.headerNav.current.offsetHeight
      this.header.current.style.top = `-${this.header.current.offsetHeight - navHeight}px`
      this.header.current.style.position = "sticky"
      // The nav stays pinned once the header shrinks; publish its height so
      // sticky page content can offset itself to clear it.
      document.documentElement.style.setProperty("--header-pinned-height", `${navHeight}px`)
    }

    if (!this.state.backgroundImage || this.state.backgroundImage === null) {
      this.fetchRandomImage()
    }
  }

  async fetchRandomImage() {
    try {
      const response = await fetch("https://alexwilson.tech/__service/random-header-image")
      if (response.ok && response.url) {
        const { origin, pathname } = new URL(response.url)
        this.setState({
          backgroundImage: `${origin}${pathname}`
        })
      }
    } catch {
    }
  }

  render() {
    const { section = null, compact = false } = this.props
    const { pathname } = this.props.location ?? { pathname: '/' }

    return (
      <header role="banner" className={`alex-header${compact ? ' alex-header--compact' : ''}`} ref={this.header as React.RefObject<HTMLElement>}>

        <HeaderImage src={this.state.backgroundImage} blur={this.state.navigationExpanded} />

        <div className="alex-header--container">

          {!(compact && this.state.navigationExpanded) && (
            <div className="alex-header__about">
              <div className="alex-header__about-primary">
                <img
                  className="alex-header__avatar"
                  src="https://avatars.githubusercontent.com/u/440052"
                  alt="Alex"
                />
                <h1 className="alex-header__name">{compact ? 'Alex' : <>Alex <span className="alex-header__surname">Wilson</span></>}</h1>
              </div>
              <span className="alex-header__intro">On products, engineering & everything in-between.</span>
            </div>
          )}

          <nav ref={this.headerNav as React.RefObject<HTMLElement>} className="alex-header__nav--container">
            <a
              className="alex-header__menu-button" role="button"
              aria-pressed={this.state.navigationExpanded}
              onClick={() => {
                this.setState({
                  navigationExpanded: !this.state.navigationExpanded
                })
              }}
            >
              <span></span>
              <span></span>
              <span></span>
            </a>
            <ul className="alex-header__nav" id="menu" aria-expanded={this.state.navigationExpanded}>
              {this.props.nav ? (
                this.props.nav.map((item) => (
                  <NavItem key={item.url} url={item.url} active={item.active} rel={item.rel} width={item.width}>{item.label}</NavItem>
                ))
              ) : (
                <>
                  <NavItem url="/" active={pathname === "/"}>Home</NavItem>
                  <NavItem url="/about" active={pathname === "/about"}>About Me</NavItem>
                  <NavItem url="/blog" active={section !== null && section === "blog"}>Writing</NavItem>
                  <NavItem url="/talks" active={section !== null && section === "talks"}>Speaking</NavItem>
                  <NavSpacer />

                  <NavItem url="https://bsky.app/profile/alexwilson.bsky.social" rel='me' width='thin'><Icon src={blueskyUrl} title="Bluesky" /></NavItem>
                  <NavItem url="https://www.linkedin.com/in/alex-/" rel='me' width='thin'><Icon src={linkedinUrl} title="LinkedIn" /></NavItem>
                  <NavItem url="https://www.instagram.com/alx.946" rel='me' width='thin'><Icon src={instagramUrl} title="Instagram" /></NavItem>
                  <NavItem url="https://mastodon.social/@alexwilson" rel='me' width='thin'><Icon src={mastodonUrl} title="Mastodon" /></NavItem>
                  <NavItem url="https://github.com/alexwilson" rel='me' width='thin'><Icon src={githubUrl} title="GitHub" /></NavItem>
                </>
              )}
            </ul>
          </nav>

        </div>
      </header>)
  }
}

export default Header
