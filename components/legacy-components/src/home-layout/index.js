import React from 'react'
import './home-layout.scss'

export function HomeSection({ children }) {
  return <div className="alex-home__section">{children}</div>
}

export function HomeTilestack({ children }) {
  return <div className="alex-home__tilestack">{children}</div>
}

export function HomeTilestackItem({ children }) {
  return <div className="alex-home__tilestack-item">{children}</div>
}

export default function HomeLayout({ children }) {
  return <div className="alex-home">{children}</div>
}
