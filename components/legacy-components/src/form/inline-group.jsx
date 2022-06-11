import React from 'react'

export default function InlineGroup({children, ...props}) {
  return (
    <div class="alex-form__inline-group" {...props}>
        {children}
    </div>
  )
}
