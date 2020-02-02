import React from 'react'

export default function responsiveImage({src, alt, width, height, quality, format, className}) {

  const queryParams = []
  if (Number.isInteger(width)) queryParams.push(`width=${width}`)
  if (Number.isInteger(height)) queryParams.push(`height=${height}`)

  if (quality) {
    queryParams.push(`quality=${quality}`)
  }

  if (format) {
    queryParams.push(`format=${format}`)
  }

  return (
    <img
        src={`https://imagecdn.app/v2/image/${encodeURIComponent(src)}?${queryParams.join('&')}`}
        className={`responsive ${className}`}
        alt={alt}
    />
  )
}
