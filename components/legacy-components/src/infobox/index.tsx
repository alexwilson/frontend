import React from 'react'
import './infobox.scss'

type Props = {
  children?: React.ReactNode
}

export default function Infobox({ children }: Props) {
  return (
    <div className="alex-infobox">
      {children}
    </div>
  )
}
