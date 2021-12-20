import React from 'react'

export default function Input({children, ...props}) {
  return (
    <input className="alex-form__input" {...props}>{children}</input>
  )
}
