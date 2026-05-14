import React from 'react'
import './home-layout.scss'

type ChildrenProps = {
  children?: React.ReactNode
}

export function HomeSection({ children }: ChildrenProps) {
  return <div className="alex-home__section">{children}</div>
}

export function HomeTilestack({ children }: ChildrenProps) {
  return <div className="alex-home__tilestack">{children}</div>
}

export function HomeTilestackItem({ children }: ChildrenProps) {
  return <div className="alex-home__tilestack-item">{children}</div>
}

export default function HomeLayout({ children }: ChildrenProps) {
  return <div className="alex-home">{children}</div>
}
