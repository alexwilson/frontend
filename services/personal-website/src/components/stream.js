import React from "react"

const Stream = ({ children, sidebar, header }) => (
  <div className="alex-stream">
    {header && <div className="alex-stream__header">{header}</div>}
    <div className="alex-stream__main">
      {children}
    </div>
    {sidebar && (
      <aside className="alex-stream__sidebar">
        {sidebar}
      </aside>
    )}
  </div>
)

export default Stream
