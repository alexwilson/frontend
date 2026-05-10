import { Link as GatsbyLink } from 'gatsby'
import { createContext } from 'react'

const Link = GatsbyLink

export const LinkContext = createContext(GatsbyLink)

export default Link
export { Link, GatsbyLink }
