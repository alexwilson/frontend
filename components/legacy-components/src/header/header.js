import { Link } from '@reach/router'
import PropTypes from "prop-types"
import React, { Component } from "react"
import promiseImageLoader from 'promise-image-loader'
import fetch from "isomorphic-fetch"

const NavItemFactory = (linkImplementation) => {
  const LinkImplementation = (linkImplementation) ? linkImplementation : Link;
  const NavItem = ({ url, rel, active, width, children }) => {
    const classList = ["alex-header__nav-item"]
    if (active) classList.push("alex-header__nav-item--active")
    if (width) classList.push(`alex-header__nav-item--width-${width}`)
    return (
      <li className={classList.join(' ')}>
        <LinkImplementation rel={rel} to={url}>{children}</LinkImplementation>
      </li>
    );
  }

  return NavItem;
}

const NavSpacer = () => (
  <li className="alex-header__nav-item alex-header__nav-item--spacer"></li>
)

const Icon = ({ src, title }) => (
  <img
    src={src}
    // onerror={`"this.src='https://imagecdn.app/v2/image/${encodeURIComponent(icon)}?format=png&width=90'"`}
    alt={title}
    className="large"
    height="1em"
  />
)

class HeaderImage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      preloadedImage: undefined
    }
  }

  preloadImage(src) {
    const actualSrc = this.imageService(this.props.src, [
      'quality=high',
      'format=jpg',
      'width=1920'
    ])
    promiseImageLoader(new Image(actualSrc))
      .then(() => this.setState({
        preloadedImage: actualSrc
      }))
      .catch(() => { })
  }

  imageService(url, params = []) {
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
          ]) : null} />
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

class Header extends Component {

  constructor(props) {
    super(props)
    this.navItem = NavItemFactory(props.linkImplementation)
    this.header = React.createRef()
    this.headerNav = React.createRef()
    this.state = {
      backgroundImage: props.image, // Is this bad?
      backgroundImageLoaded: false,
      navigationExpanded: false
    }
  }

  componentDidMount() {
    this.header.current.style.top = `-${this.header.current.offsetHeight - this.headerNav.current.offsetHeight}px`
    this.header.current.style.position = "sticky";

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
    const { section = null } = this.props
    const { pathname } = this.props.location

    return (
      <header role="banner" className={`alex-header`} ref={this.header}>

        <HeaderImage src={this.state.backgroundImage} blur={this.state.navigationExpanded} />

        <div className="alex-header--container">

          <div className="alex-header__about">
            <h1 className="alex-header__name">Alex Wilson</h1>
            <span className="alex-header__intro">On products, engineering & everything in-between.</span>
          </div>


          <nav ref={this.headerNav} className="alex-header__nav--container">
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
              <this.navItem url="/" active={pathname === "/"}>Home</this.navItem>
              <this.navItem url="/about-me" active={pathname === "/about-me"}>About Me</this.navItem>
              <this.navItem url="/blog" active={section && section === "blog"}>Writing</this.navItem>
              <this.navItem url="/talks" active={section && section === "talks"}>Speaking</this.navItem>
              <NavSpacer />

              <this.navItem url="https://bsky.app/profile/alexwilson.bsky.social" rel='me' width='thin'><Icon src="/svg/bluesky.svg" title="Bluesky" /></this.navItem>
              <this.navItem url="https://www.linkedin.com/in/alex-/" rel='me' width='thin'><Icon src="/svg/linkedin.svg" title="LinkedIn" /></this.navItem>
              <this.navItem url="https://www.instagram.com/alexwilson.tech" rel='me' width='thin'><Icon src="/svg/instagram.svg" title="instagram" /></this.navItem>
              <this.navItem url="https://mastodon.social/@alexwilson" rel='me' width='thin'><Icon src="/svg/mastodon.svg" title="Mastodon" /></this.navItem>
              <this.navItem url="https://github.com/alexwilson" rel='me' width='thin'><Icon src="/svg/github.svg" title="Github" /></this.navItem>
            </ul>
          </nav>

        </div>
      </header>)
  }
}

Header.propTypes = {
  image: PropTypes.string,
  location: PropTypes.object.isRequired,
  section: PropTypes.oneOf(["blog", "talks"]),
  linkImplementation: PropTypes.elementType
}

Header.defaultProps = {
  image: null,
  section: null,
  linkImplementation: Link
}

export default Header
