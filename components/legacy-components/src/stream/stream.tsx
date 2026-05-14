import React from 'react'

type Props = {
  children?: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
}

const Stream = ({ children, sidebar, header }: Props) => (
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
