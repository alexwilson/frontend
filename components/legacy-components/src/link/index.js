import React, { createContext, useContext } from 'react'

export const LinkContext = createContext(
  ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children)
)

const Link = ({ to, children, ...props }) => {
  const LinkComponent = useContext(LinkContext)
  return React.createElement(LinkComponent, { to, ...props }, children)
}

export default Link
export { Link }
