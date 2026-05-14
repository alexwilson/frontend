import React from 'react'

type Props = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode
}

export default function InlineGroup({ children, ...props }: Props) {
  return (
    <div className="alex-form__inline-group" {...props}>
      {children}
    </div>
  )
}
