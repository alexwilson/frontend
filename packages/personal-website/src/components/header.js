import { Link } from "gatsby"
import PropTypes from "prop-types"
import React, {Component} from "react"
import promiseImageLoader from 'promise-image-loader'
import fetch from "isomorphic-fetch"


const ALink = ({url, children, rel}) => {
  const isAbsolute = /^(https?:)?\/\//
  return isAbsolute.test(url) ? <a rel={rel} href={url}>{children}</a> : <Link to={url}>{children}</Link>
}

const NavItem = ({url, rel, active, children}) => (
  <li className={`alex-header__nav-item ${active ? "alex-header__nav-item--active" : null}`}>
    <ALink rel={rel} url={url}>{children}</ALink>
  </li>
)

const NavSpacer = () => (
  <li className="alex-header__nav-item alex-header__nav-item--spacer"></li>
)

const Icon = ({src, title}) => (
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
    const actualSrc = this.imageService(this.props.src, [])
    promiseImageLoader(new Image(actualSrc))
      .then(() => this.setState({
        preloadedImage: actualSrc
      }))
      .catch(() => {})
  }

  imageService(url, params = []) {
    return `https://imagecdn.app/v2/image/${encodeURIComponent(url)}?${params.join('&')}`
  }

  render() {
    const {src} = this.props
    return <div className={`alex-header-image`}>
      <picture className={`alex-header-image--container`}>
        <img
          alt="Header"
          className={`alex-header-image__blur`}
          onLoad={this.preloadImage.bind(this, src)}
          src={src !== null ? this.imageService(src, [
            'width=25',
            'height=10',
            'quality=low',
            'format=jpg'
          ]): null} />
        <img
          alt="Header"
          className={`alex-header-image__main`}
          src={this.state.preloadedImage}
          style={{
            opacity: this.state.preloadedImage !== undefined ? 1 : 0
          }}/>
      </picture>
    </div>
  }
}

class Header extends Component {

  constructor(props) {
    super(props)
    this.header = React.createRef()
    this.headerNav = React.createRef()
    this.state = {
      backgroundImage: props.image, // Is this bad?
      backgroundImageLoaded: false
    }
  }

  componentDidMount() {
    this.header.current.style.top = `-${this.header.current.offsetHeight - this.headerNav.current.offsetHeight}px`
    this.header.current.style.position = "sticky";

    if (!this.state.backgroundImage || this.state.backgroundImage === null) {
      this.fetchRandomImage()
    }
  }

  fetchRandomImage() {
    try {
      const response = await fetch('https://source.unsplash.com/collection/33719360/0x0')
      if (response.ok && response.url) {
        const {origin, pathname} = new URL(response.url)
        this.setState({
          backgroundImage: `${origin}${pathname}`
        })
      }
    } catch {
    }
  }

  render() {
    const {pathname} = this.props.location
    const name = this.props.name ? this.props.name : "Alex Wilson"
    const intro = this.props.intro ? this.props.intro : "Software Engineer, Technical Architect — Helping build a better, faster internet."

    return (
      <header role="banner" className={`alex-header`} ref={this.header}>

        <HeaderImage src={this.state.backgroundImage}/>

        <div className="alex-header--container">

          <div className="alex-header__about">
              <h1 className="alex-header__name">{name}</h1>
              <span className="alex-header__intro">{intro}</span>
          </div>


          <nav>
              <ul className="alex-header__nav" id="menu" ref={this.headerNav}>
                <NavItem url="/" active={pathname === "/"}>Home</NavItem>
                <NavItem url="/about-me/" active={pathname.startsWith("/about-me/")}>About Me</NavItem>
                <NavItem url="/blog/" active={pathname.startsWith("/blog/")}>Blog</NavItem>
                <NavItem url="/talks/" active={pathname.startsWith("/talks/")}>Talks</NavItem>
                <NavItem url="/consultancy/" active={pathname.startsWith("/consultancy/")}>Hire Me</NavItem>

                <NavSpacer />

                <NavItem url="https://twitter.com/AlexWilsonV1" rel='me'><Icon src="/svg/twitter.svg" title="Twitter" /></NavItem>
                <NavItem url="https://www.linkedin.com/in/alex-/" rel='me'><Icon src="/svg/linkedin.svg" title="LinkedIn" /></NavItem>
                <NavItem url="https://github.com/alexwilson" rel='me'><Icon src="/svg/github.svg" title="Github" /></NavItem>
              </ul>
          </nav>

      </div>
    </header>)
  }
}

Header.propTypes = {
  siteTitle: PropTypes.string,
  image: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: `Alex Wilson`,
  image: null,
}

export default Header
