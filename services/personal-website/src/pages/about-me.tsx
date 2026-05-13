import React from "react"
import { PageProps } from "gatsby"

import ArticleLayout from "@alexwilson/ds-legacy-components/src/article-layout"
import ResponsiveImage from "@alexwilson/ds-legacy-components/src/responsive-image"
import Layout from "../components/layout"
import SEO from "../components/seo"

export default function AboutMe({ location }: PageProps) {
  return (
    <Layout location={location}>
      <ArticleLayout
        aside={
          <>
            <br />
            <ResponsiveImage
              src="https://avatars.githubusercontent.com/u/440052"
              width={300}
              alt="A photograph of Alex Wilson"
            />
          </>
        }
      >
        <article
          className="alex-article__body"
          itemScope
          itemType="http://schema.org/Person"
        >
          <p>
            My name is Alex. I'm a driven engineering lead, and at work I enjoy
            both building teams and products.
            <br />
          </p>

          <p>
            Outside of work I enjoy travelling, music production and
            photography. And writing this blog. I'm also a perpetually injured
            runner.
          </p>
          <div className="alex-article__pane">
            <p className="alex-article__pane-half iota">
              <h2 className="eta">Ask Me About</h2>
              🏙 <strong>Architecture & Design</strong>: We're surrounded by
              ingenuity in buildings and everyday objects.
              <br />
              🎵 <strong>Music</strong>: I'm an avid listener, and enjoy
              producing & playing electronic music under a pseudonym.
              <br />
              📰 <strong>Journalism</strong>: I love investigative and data
              reporting, and am always reading longform narratives like{" "}
              <a href="https://www.goodreads.com/book/show/37976541-bad-blood">
                Bad Blood
              </a>
              .
            </p>
            <p className="alex-article__pane-half iota">
              <h2 className="eta">Secret Answers</h2>
              🐠 My first pet was an Angel fish named Angel.
              <br />
              💼 My favourite film director is Nolan.
              <br />
              ♟️ My favourite boardgame is Chess.
              <br />
              🕹️ My favourite videogame is Super Metroid.
              <br />
              📺 I don't have a favourite TV series.
              <br />
              🔐 I'm not telling you if I use a password manager.
              <br />
            </p>
          </div>

          <p>
            <h2 className="eta">Skills</h2>
            <ul className="eta">
              <li>
                12 years commercial experience in full-stack software
                engineering, with JS, PHP, Java, Ruby and Golang: Utilising the
                overall-best-fit tools to solve a problem.
              </li>
              <li>
                Stakeholder management & requirement-gathering across business
                domains. Experience and knowledge of digital media domains.
              </li>
              <li>
                Team leadership & line-management experience, growing
                multi-disciplinary teams from the ground up through to feature
                delivery.
              </li>
              <li>
                Tracing, diagnosing and mitigating faults in diverse technical
                stacks — Legacy, distributed systems, etc.
              </li>
              <li>
                Solutions & application architecture throughout the stack, from
                front-end caching strategies to messaging patterns.
              </li>
              <li>
                Rich understanding of modern technologies, including
                in-development browser APIs, their adoption path and their
                business value.
              </li>
            </ul>
          </p>
          <p className="eta">
            <h2 className="eta">Technical Proficiencies</h2>
            <ul className="eta">
              <li>
                App: <i>Electron, React Native, ReactJS</i>
              </li>
              <li>
                Blockchain: <i>Ethereum, Smart contracts</i>
              </li>
              <li>
                CDN: <i>Fastly, Varnish Plus, AWS CloudFront, Cloudflare</i>
              </li>
              <li>
                Cloud Practioner:{" "}
                <i>
                  AWS (Lambda, S3, CloudFormation, DynamoDB, API Gateway, and
                  more), DigitalOcean, Google Cloud Platform
                </i>
              </li>
              <li>
                Configuration Management: <i>Ansible, Puppet, Terraform</i>
              </li>
              <li>
                Languages:{" "}
                <i>
                  JavaScript (TypeScript, Browser, ESNext, NodeJS), Golang,
                  Rust, Java, Python, Ruby, PHP
                </i>
              </li>
              <li>
                Operating{" "}
                <i>
                  Systems: macOS, FreeBSD, Gentoo Linux, Debian/Ubuntu Linux
                </i>
              </li>
              <li>
                Security: <i>OWASP, PWK</i>
              </li>
              <li>
                Testing:{" "}
                <i>Cucumber/Gherkin, Jest, *Unit; Cypress, CircleCI, Jenkins</i>
              </li>
            </ul>
          </p>

          <p>
            I am not actively seeking a full-time role, however{" "}
            <a href="https://alexwilson.tech/cv">you may see my full CV here</a>
            , alternatively,{" "}
            <a href="https://www.linkedin.com/in/alex-/">
              please connect with me on LinkedIn
            </a>
            .
          </p>
          <p>
            <h2 className="eta">Work Experience</h2>
            <ul className="eta">
              <li>
                <i>Dec 2024–Present</i>: Staff Engineer, Business Platform
                Development, <a href="https://www.moneyforward.com/">Money Forward</a>
              </li>
              <li>
                <i>Jan 2022–Nov 2024</i>: Principal Engineer, Customer Products,{" "}
                <a href="https://www.ft.com/">Financial Times</a>
              </li>
              <li>
                <i>Jun 2022–Jan 2023</i>: Acting Technical Director, Customer
                Products, <a href="https://www.ft.com/">Financial Times</a>
              </li>
              <li>
                <i>Jan 2021–Jan 2022</i>: Principal Engineer, New Products &
                Enterprise, <a href="https://www.ft.com/">Financial Times</a>
              </li>
              <li>
                <i>Apr 2019–Jan 2021</i>: Principal Engineer, FT Group Products,{" "}
                <a href="https://www.ft.com/">Financial Times</a>
              </li>
              <li>
                <i>Oct 2016–Apr 2019</i>: Principal Developer,{" "}
                <a href="https://www.bluetel.co.uk/">Bluetel</a>
              </li>
              <li>
                <i>Oct 2013–Oct 2016</i>: Software Developer,{" "}
                <a href="https://www.bluetel.co.uk/">Bluetel</a>
              </li>
              <li>
                <i>Sep 2009—Jul 2013</i>: Software Developer & SysAdmin,{" "}
                <a href="https://alexwilson.tech/">Freelance</a>
              </li>
            </ul>
          </p>
        </article>
      </ArticleLayout>
    </Layout>
  )
}

export const Head = () => (
  <SEO
    title="About Alex Wilson"
    keywords={[`alex wilson`, `software engineer`]}
    canonicalUrl="https://alexwilson.tech/about-me"
  />
)
