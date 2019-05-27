import React from 'react'

export default function responsiveImage({src, alt, width, height, className}) {

  const queryParams = []
  if (Number.isInteger(width)) queryParams.push(`width=${width}`)
  if (Number.isInteger(height)) queryParams.push(`height=${height}`)

  return (
    <img
        src={`https://imagecdn.app/v2/image/${encodeURIComponent(src)}?${queryParams.join('&')}`}
        className={`responsive ${className}`}
        alt={alt}
    />
  )
}
