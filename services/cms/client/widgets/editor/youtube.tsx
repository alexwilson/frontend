import React from 'react';

interface YouTubeData {
  id: string
}

export function YouTubePreviewComponent(props: YouTubeData) {
  return <img src={`http://img.youtube.com/vi/${props.id}/hqdefault.jpg`} />
}

export const YouTube = {
  id: "youtube",
  label: "YouTube",
  fields: [{ name: 'id', label: 'Youtube Video ID', widget: 'string' }],
  pattern: /^`youtube\: (\S+)`$/,
  fromBlock: function(match: RegExpMatchArray): YouTubeData {
    return { id: match[1] }
  },
  toBlock: function(data: YouTubeData): string {
    return `\`youtube: ${data.id}\``
  },
  toPreview: YouTubePreviewComponent
}

export default YouTube