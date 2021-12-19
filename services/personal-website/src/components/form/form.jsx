import React from 'react'
export default function Form({children, ...props}) {
  return (
    <form className="alex-form" {...props}>
      {children}
    </form>
  )
}
