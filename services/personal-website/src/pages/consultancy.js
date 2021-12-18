import React from "react"
import { Link } from 'gatsby'

import Layout from "../components/layout"
import Header from "../components/header"
import ConsultFooter from "../components/consult-footer"
import SEO from "../components/seo"

const ConsultancyPage = ({ location }) => (
  <Layout location={location}>
    <SEO title="Consultancy" keywords={[`software consultancy`, `engineering management`]} />
    <Header name={""} intro={"Software's really about people."} location={location} image={`https://alexwilson.tech/consultancy/images/header.jpg`} />
    <div className="consultancy">

      <section className="consultancy-lede">
        <p style={{textAlign:'center'}}>
          <span role="img" aria-label="Welcome">👋</span>
          Hi, I’m Alex and I’d like to help you solve your business and technology problems. <Link to="/about-me/">
          You can read a bit about my background here.</Link>
        </p>
      </section>

      <section className="consultancy-service-header">
        <span className="consultancy-divider"></span>
        <h1>Services</h1>
      </section>

      <section className="consultancy-service">
        <h3 className="consultancy-service__title">Team Formation, Hiring & Culture</h3>
        <div className="consultancy-service__text">
          <p>
            Building inclusive, multidisciplinary teams can be hard whether improving an existing one or forming from scratch.
            By bringing engineering and product management expertise, <strong>I can help you build and improve high-performing
            teams</strong> with industry best-practice from sourcing, recruiting, on-boarding all the way through to delivering
            value at scale.
          </p>
          {/* <ul></ul> */}
        </div>
        <img className="consultancy-service__icon" src="/consultancy/svg/Heart.svg" alt="Heart Motif" />
      </section>

      <section className="consultancy-service">
        <h3 className="consultancy-service__title">Penetration Testing</h3>
        <img className="consultancy-service__icon" src="/consultancy/svg/Shield.svg" alt="Shield Motif" />
        <div className="consultancy-service__text">
          <p>
            Security is an area of technology & business development which is broadly misunderstood. The risks in technology
            estates alone tend to be far broader than people understand, and many organisations are being caught out everyday
            by increasingly advanced threats. Working independently or with you and your teams, <strong>I can help you find
            and mitigate your risks</strong>.
            {/* <ul></ul> */}
          </p>
        </div>
      </section>

      <section className="consultancy-service">
        <h3 className="consultancy-service__title">Architecture Consultation</h3>
        <div className="consultancy-service__text">
          <p>
            Designing software to effectively meet our user and business needs is hard: There's so much noise around patterns,
            technologies and tools that it's easy to forget what's really important. <em>Technology tends to be presented as a
            solution before we discover the problem</em>.<br />
            As user-needs and organisations evolve, the approach that worked yesterday might be a blocker today. From
            microservices through to mobile applications, <strong>I can help design/adapt architecture and its design process
            to empower everybody and to work for your business</strong>.<br />
            <ul>
              <li>Building focus on the right problems</li>
              <li>Bringing technology together with other departments</li>
              <li>Continuous delivery and iteration</li>
              <li>Ensuring quality in every release</li>
              <li>Improved cost-effectiveness</li>
            </ul>
          </p>
        </div>
        <img className="consultancy-service__icon" src="/consultancy/svg/Software_Architecture.svg" alt="Architecture Motif" />
      </section>

      <section className="consultancy-service">
        <h3 className="consultancy-service__title">Development Projects</h3>
        <img className="consultancy-service__icon" src="/consultancy/svg/Launch.svg" alt="Rocket Launch Motif" />
        <div className="consultancy-service__text">
          <p>Looking for a senior or lead engineer to join your team?
            <br />
            <em>I am not currently taking on extended projects, however please still get in touch: I share a network of connections
              including brilliant freelancers and contractors who will be able to help you.</em>
          </p>
        </div>
      </section>


      <section className="consultancy-contact">
        <span className="consultancy-divider"></span>
        <form
          className="alex-form"
          action="https://submit-form.com/scLP4bAyhQ-BPImqhr5A0" target="_self"
          >
          <h1>Please get in touch</h1>
          <p>
            Even if you're not ready or able for a full engagement and would still like some advice/help, I'd love to grab a
            coffee — please get in touch!
          </p>
          <input className="alex-form__input" type="checkbox" name="i-am-human" style={{display: 'none'}} tabindex="-1" autocomplete="off" />
          <input className="alex-form__input" type="text" name="name" placeholder="Name" />
          <input className="alex-form__input" type="text" name="phone" placeholder="Phone" />
          <input className="alex-form__input" type="text" name="email" placeholder="Email" />
          <textarea
            className="alex-form__input alex-form__input--textarea"
            name="message"
            placeholder="How can I help?"
          >
          </textarea>
          <button
            className="alex-form__input alex-form__input--submit"
            type="submit"
          >Submit</button>
        </form>
      </section>
    </div>
  <ConsultFooter />
  </Layout>
)

export default ConsultancyPage
