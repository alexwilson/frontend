import React, {Component} from 'react';
export const YouTube = {
    id: "youtube",
    label: "YouTube",
    fields: [{name: 'id', label: 'Youtube Video ID', widget: 'string'}],
    pattern: /^`youtube\: (\S+)`$/,
    fromBlock: function(match) {
      return {
        id: match[1]
      };
    },
    toBlock: function(props) {
      return `\`youtube: ${props.id}\``;
    },
    toPreview: YouTubePreviewComponent
  }

  export function YouTubePreviewComponent (props) {
        return <img src={`http://img.youtube.com/vi/${props.id}/hqdefault.jpg`} />
  } 

  export default YouTube