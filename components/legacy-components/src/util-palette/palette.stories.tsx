import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import './palette.stories.scss'

type SwatchData = { chip: string; name: string; description?: string }

type SwatchProps = SwatchData

const Swatch = ({ chip, name, description }: SwatchProps) => (
  <div className="ds-swatch">
    <div className={`ds-swatch__chip chip--${chip}`} />
    <div className="ds-swatch__label">
      <strong>{name}</strong>
      {description && <><br />{description}</>}
    </div>
  </div>
)

type SwatchRowProps = { title: string; swatches: SwatchData[] }

const SwatchRow = ({ title, swatches }: SwatchRowProps) => (
  <section>
    <h3 style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#555', marginBottom: '0.5rem' }}>{title}</h3>
    <div className="ds-swatches">
      {swatches.map(s => <Swatch key={s.chip} {...s} />)}
    </div>
  </section>
)

const meta: Meta = {
  title: 'Legacy/Utils/Palette',
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof meta>

export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <SwatchRow title="Greyscale" swatches={[
        { chip: 'white',  name: '$white',  description: '#FFFFFF' },
        { chip: 'grey-1', name: '$grey-1', description: 'darken 3%' },
        { chip: 'grey-2', name: '$grey-2', description: 'darken 10%' },
        { chip: 'grey-3', name: '$grey-3', description: 'darken 20%' },
        { chip: 'grey-4', name: '$grey-4', description: 'darken 50%' },
        { chip: 'grey-5', name: '$grey-5', description: 'darken 80%' },
        { chip: 'grey-6', name: '$grey-6', description: 'darken 95%' },
      ]} />
      <SwatchRow title="Blues" swatches={[
        { chip: 'blue',   name: '$blue',   description: '#1A8CFF — brand' },
        { chip: 'blue-1', name: '$blue-1', description: 'lighten 3%' },
        { chip: 'blue-2', name: '$blue-2', description: 'lighten 10%' },
        { chip: 'blue-3', name: '$blue-3', description: 'lighten 20%' },
        { chip: 'blue-4', name: '$blue-4', description: 'lighten 38%' },
      ]} />
      <SwatchRow title="Oranges" swatches={[
        { chip: 'orange',   name: '$orange',   description: '#FEF2E7 base' },
        { chip: 'orange-1', name: '$orange-1', description: 'darken 3%' },
        { chip: 'orange-2', name: '$orange-2', description: 'darken 10%' },
        { chip: 'orange-3', name: '$orange-3', description: 'darken 20%' },
        { chip: 'orange-4', name: '$orange-4', description: 'darken 50%' },
      ]} />
      <SwatchRow title="Functional" swatches={[
        { chip: 'brand',      name: '$brand',             description: '= $blue' },
        { chip: 'complement', name: '$complement',        description: 'hue +180°' },
        { chip: 'header-bg',  name: '$header-background', description: 'rgba grey-5 70%' },
      ]} />
    </div>
  ),
}
