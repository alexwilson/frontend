import React from 'react'

type Props = {
  value?: string
}

export default function Submit({ value }: Props) {
  return (
    <button
      className="alex-form__input alex-form__input--submit"
      type="submit"
    >{value ? value : "Submit"}</button>
  )
}
