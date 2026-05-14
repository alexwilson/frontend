import React from 'react'

type Props = React.FormHTMLAttributes<HTMLFormElement> & {
  children?: React.ReactNode
}

export default function Form({ children, ...props }: Props) {
  return (
    <form className="alex-form" {...props}>
      {children}
    </form>
  )
}
