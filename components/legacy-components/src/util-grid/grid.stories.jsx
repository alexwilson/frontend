import React from 'react'
import './grid.stories.scss'

const ColDemo = ({ cols, label }) => (
  <div className="ds-grid-demo">
    <h3>{label}</h3>
    <div className="ds-row">
      {cols.map((w, i) => (
        <div key={i} className={`ds-col-${w}`}>{w}/10</div>
      ))}
    </div>
  </div>
)

export default {
  title: 'Legacy/Utils/Grid',
  parameters: { layout: 'fullscreen' },
}

export const Container = {
  render: () => (
    <div style={{ background: '#e8edf5', padding: '2rem 0' }}>
      <div className="ds-container">
        <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem' }}>
          <strong>alex-container()</strong> — max-width: 1200px, width: 90%, margin: auto
        </p>
      </div>
    </div>
  ),
}

export const Columns = {
  render: () => (
    <div className="ds-container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <ColDemo cols={[1,1,1,1,1,1,1,1,1,1]} label="10 equal columns (1/10 each)" />
      <ColDemo cols={[2,2,2,2,2]}           label="5 equal columns (2/10 each)" />
      <ColDemo cols={[5,5]}                  label="2 equal columns (5/10 each)" />
    </div>
  ),
}

export const ContentLayouts = {
  render: () => (
    <div className="ds-container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <ColDemo cols={[8, 2]} label="Article layout (8/10 + 2/10 aside)" />
      <ColDemo cols={[7, 3]} label="Wide article layout (7/10 + 3/10 aside)" />
      <ColDemo cols={[6, 4]} label="Balanced split (6/10 + 4/10)" />
      <ColDemo cols={[3, 7]} label="Reversed (3/10 + 7/10)" />
    </div>
  ),
}

export const ThreeColumns = {
  render: () => (
    <div className="ds-container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <ColDemo cols={[3,4,3]}   label="Featured centre (3 + 4 + 3)" />
      <ColDemo cols={[4,3,3]}   label="Left-weighted (4 + 3 + 3)" />
      <ColDemo cols={[2,6,2]}   label="Narrow gutters (2 + 6 + 2)" />
    </div>
  ),
}

export const AllColumnWidths = {
  render: () => (
    <div className="ds-container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <div key={n} className="ds-row" style={{ marginBottom: '0.5rem' }}>
          <div className={`ds-col-${n}`}>{n}/10</div>
          <div className={`ds-col-label-${10 - n}`}>{10 - n}/10 remaining</div>
        </div>
      ))}
    </div>
  ),
}
