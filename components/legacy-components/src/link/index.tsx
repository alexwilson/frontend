import React, { createContext, useContext } from 'react'

export type LinkProps = {
  to: string
  children?: React.ReactNode
  rel?: string
  className?: string
  [key: string]: unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LinkContext = createContext<React.ComponentType<any>>(
  ({ to, children, ...props }: LinkProps) => React.createElement('a', { href: to, ...props }, children)
)

const Link = ({ to, children, ...props }: LinkProps) => {
  const LinkComponent = useContext(LinkContext)
  return React.createElement(LinkComponent, { to, ...props }, children)
}

export default Link
export { Link }
