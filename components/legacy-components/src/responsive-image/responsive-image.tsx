import React from 'react'

type Props = {
  src: string
  alt?: string
  width?: number
  height?: number
  quality?: string
  format?: string
  className?: string
}

export default function ResponsiveImage({ src, alt, width, height, quality, format, className }: Props) {

  const queryParams: string[] = []
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
      className={`responsive-image${className ? ` ${className}` : ''}`}
      alt={alt}
    />
  )
}
