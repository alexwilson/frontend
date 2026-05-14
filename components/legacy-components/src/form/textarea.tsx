import React from 'react'

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  children?: React.ReactNode
}

export default function TextArea({ children, ...props }: Props) {
  return (
    <textarea className="alex-form__input alex-form__input--textarea" {...props}>
      {children}
    </textarea>
  )
}
