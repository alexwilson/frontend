import React from 'react'
import {Link} from 'gatsby'

import Layout from "../components/layout"
import SEO from "../components/seo"
import ResponsiveImage from "@alexwilson/legacy-components/src/responsive-image"

export default function aboutMe({location}) {
  return <Layout location={location}>
    <SEO title="About Alex Wilson" keywords={[`alex wilson`, `software engineer`]} />
    <div className="alex-article">
      <div className="alex-article__main" itemScope="author" itemType="http://schema.org/Person">
          <section className="alex-article__body">
              <p className="delta">
                  My name is Alex. I'm a driven full-stack software engineer and technology lead, passionate about web-standards, journalism and solving business problems.<br />
                  I want to help improve the web, for everybody.
              </p>
          </section>
          <section className="alex-article__body">
              <p>
                  In my downtime, I enjoy travelling, music production and photography. Most often I can be found reading, or tinkering with computers, servers and code.
              </p>
              <div className="alex-article__pane">
                  <p className="alex-article__pane-half iota">
                      <b className="eta">Ask Me About</b><br />
                      🏙 Architecture & Design: Software is shown-up by the ingenuity in buildings and everyday objects.<br />
                      💊 Biohacking & Kaizen: I employ a data-driven approach to my life following the quantified-self principle.<br />
                      🇯🇵 Japan: Having lived and worked there for a couple of months, I have fallen in love with the country.<br />
                  </p>
                  <p className="alex-article__pane-half iota">
                      <b className="eta">Secret Answers</b><br />
                      🐠 My first pet was an Angel fish named Angel.<br />
                      💼 My favourite film director is Tarantino.<br />
                      👻 My favourite anime is Ghost in the Shell.<br />
                      🕹️ My favourite videogame is Super Metroid.<br />
                      📺 I don't have a favourite TV series.<br />
                      🎵 There's too much good music.<br />
                  </p>
              </div>
          </section>
          <br />
          <section className="alex-article__body">
              <p className="eta">
                  <b className="eta">Skills</b>
                  <ul className="eta">
                      <li>9 years commercial experience in full-stack software engineering, with JS, PHP, Java, Ruby and Golang: Utilising the overall-best-fit tools to solve a problem.</li>
                      <li>Stakeholder management & requirement-gathering across business domains. Experience and knowledge of digital media domains.</li>
                      <li>Team leadership & line-management experience, growing multi-disciplinary teams from the ground up through to feature delivery.</li>
                      <li>Tracing, diagnosing and mitigating faults in diverse technical stacks — Legacy, distributed systems, etc.</li>
                      <li>Solutions & application architecture throughout the stack, from front-end caching strategies to messaging patterns.</li>
                      <li>Rich understanding of modern technologies, including in-development browser APIs, their adoption path and their business value.</li>
                  </ul>
              </p>
              <p className="eta">
                  <b className="eta">Technical Proficiencies</b>
                  <ul className="eta">
                      <li>App: <i>Electron, React Native, ReactJS</i></li>
                      <li>Blockchain: <i>Ethereum, Smart contracts</i></li>
                      <li>CDN: <i>Fastly, Varnish Plus, AWS CloudFront, Cloudflare</i></li>
                      <li>Cloud Practioner: <i>AWS (Lambda, S3, CloudFormation, DynamoDB, API Gateway, and more), DigitalOcean, Google Cloud Platform</i></li>
                      <li>Configuration Management: <i>Ansible, Puppet, Terraform</i></li>
                      <li>Languages: <i>JavaScript (TypeScript, Browser, ESNext, NodeJS), Golang, Rust, Java, Python, Ruby, PHP</i></li>
                      <li>Operating <i>Systems: macOS, FreeBSD, Gentoo Linux, Debian/Ubuntu Linux</i></li>
                      <li>Security: <i>OWASP, PWK</i></li>
                      <li>Testing: <i>Cucumber/Gherkin, Jest, *Unit; Cypress, CircleCI, Jenkins</i></li>
                  </ul>
              </p>
          </section>
          <section className="alex-article__body">
              <p className="theta">
                  I am not actively seeking a full-time role, however <a href="https://alexwilson.tech/cv">you may see my full CV here</a>, alternatively, <a href="https://www.linkedin.com/in/alex-/">please connect with me on LinkedIn</a>. I am also <Link to={'/consultancy/'}>available for consultancy</Link>.
              </p>
              <p className="eta">
                  <b className="eta">Work Experience</b>
                  <ul className="eta">
                      <li><i>Jan 2022–Present</i>: Principal Engineer, Customer Products, <a href="https://www.ft.com/">Financial Times</a></li>
                      <li><i>Jan 2021–Jan 2022</i>: Principal Engineer, New Products & Enterprise, <a href="https://www.ft.com/">Financial Times</a></li>  
                      <li><i>Apr 2019–Jan 2021</i>: Principal Engineer, FT Group Products, <a href="https://www.ft.com/">Financial Times</a></li>
                      <li><i>Oct 2016–Apr 2019</i>: Principal Developer, <a href="https://www.bluetel.co.uk/">Bluetel</a></li>
                      <li><i>Sep 2013–Oct 2016</i>: Software Developer, <a href="https://www.bluetel.co.uk/">Bluetel</a></li>
                      <li><i>Sep 2009—Jul 2013</i>: Part-Time Software Developer & SysAdmin, <a href="https://alexwilson.tech/">Freelance</a></li>
                  </ul>
              </p>
          </section>
      </div>
      <div className="alex-article__aside">
          <br />
          <ResponsiveImage src="https://avatars.githubusercontent.com/u/440052" width={300} alt="A photograph of Alex Wilson"/>
      </div>
    </div>
  </Layout>
}
