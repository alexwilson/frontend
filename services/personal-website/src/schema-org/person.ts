import Organization from "./organization"

const Author = () => ({
  "@type": "Person",
  name: "Alex",
  memberOf: Organization(),
  givenName: "Alex",
  familyName: "Wilson",
  sameAs: [
    "https://twitter.com/alexwilsonv1",
    "https://bsky.app/profile/alexwilson.bsky.social",
    "https://mastodon.social/@alexwilson",
    "https://www.linkedin.com/in/alex-/",
  ],
})

export default Author
