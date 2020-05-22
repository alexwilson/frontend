import Organization from "./organization";

const Author = () => ({
  '@type':'Person',
  'name':'Alex',
  'memberOf': Organization(),
  'givenName': 'Alex',
  'familyName': 'Wilson'
})

export default Author
