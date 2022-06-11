import React from 'react'

export default function Submit({value}) {
  return (
    <button
      className="alex-form__input alex-form__input--submit"
      type="submit"
    >{value ? value : "Submit"}</button>
  )
}
