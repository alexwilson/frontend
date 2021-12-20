import React from 'react'

export default function TextArea({children, ...props}) {
  return (
    <textarea className="alex-form__input alex-form__input--textarea">
      {children}
    </textarea>
  )
}
