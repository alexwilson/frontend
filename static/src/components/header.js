import { Link } from "gatsby"
import PropTypes from "prop-types"
import React from "react"

const NavItem = ({url, children}) => (
  <li className="alex-header__nav-item">
    <a href={url}>{children}</a>
  </li>
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

const NavSpacer = () => (
  <li className="alex-header__nav-item alex-header__nav-item--spacer"></li>
)

const Header = ({siteTitle}) => (
  <header role="banner" className="alex-header {% if page.image %}alex-header--with-image{% endif %}">
    <div className="alex-header--container">

      <div className="alex-header__about">
          <h1 className="alex-header__name">Alex Wilson</h1>
          <span className="alex-header__intro">Software Engineer, Technical Architect — Helping build a better, faster internet.</span>
      </div>


      <nav>
          <ul className="alex-header__nav" id="menu">
              {/* <li className="{% if page.url == '/index.html' or page.url == '/' %}alex-header__nav-item--active {% endif %} alex-header__nav-item">
                  <a href="/">Home</a>
              </li> */}

              <NavItem url="/">Home</NavItem>
              <NavItem url="/about-me/">About Me</NavItem>
              <NavItem url="/blog/">Blog</NavItem>
              <NavItem url="/talks/">Talks</NavItem>
              <NavSpacer />
              <NavItem url="https://twitter.com/antoligy">
                <Icon src="/svg/twitter.svg" title="Twitter" />
              </NavItem>
              <NavItem url="https://www.linkedin.com/in/alex-/">
                <Icon src="/svg/linkedin.svg" title="LinkedIn" />
              </NavItem>
              <NavItem url="https://github.com/antoligy">
                <Icon src="/svg/github.svg" title="Github" />
              </NavItem>
              {/* {% for item in site.data.navigation %}
              <li class="{% if page.url contains item.link %}alex-header__nav-item--active {% endif %}alex-header__nav-item">
                  <a href="{{ item.link }}">{{ item.title }}</a>
              </li>
              {% endfor %}
              <li class="alex-header__nav-item alex-header__nav-item--spacer"></li>
              {% for item in site.data.social %}
              <li class="alex-header__nav-item">
                  <a title="{{ item.title }}" href="{{ item.url }}" rel="me">
                      {% assign svgUrl = site.url|append: item.svg %}
                      <img
                          src="{{ svgUrl }}"
                          onerror="this.src='https://imagecdn.app/v2/image/{{svgUrl|url_encode}}?format=png&width=90'"
                          class="large"
                          alt="{{ item.title }}"
                          height="1em"
                      />
                  </a>
              </li>
              {% endfor %} */}
          </ul>
      </nav>

  </div>
  </header>
)

// const Header = ({ siteTitle }) => (
//   <header
//     style={{
//       background: `rebeccapurple`,
//       marginBottom: `1.45rem`,
//     }}
//   >
//     <div
//       style={{
//         margin: `0 auto`,
//         maxWidth: 960,
//         padding: `1.45rem 1.0875rem`,
//       }}
//     >
//       <h1 style={{ margin: 0 }}>
//         <Link
//           to="/"
//           style={{
//             color: `white`,
//             textDecoration: `none`,
//           }}
//         >
//           {siteTitle}
//         </Link>
//       </h1>
//     </div>
//   </header>
// )

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header
