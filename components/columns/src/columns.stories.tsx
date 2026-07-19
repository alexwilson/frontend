import React from 'react'
import { SPLITS, SPLIT_NAMES, type SplitName } from '@alexwilson/content'

import { Columns, Column } from './index'

export default {
  title: 'Content/Columns',
  component: Columns,
}

const Prose = ({ heading }: { heading: string }) => (
  <>
    <h3>{heading}</h3>
    <p>A column holds ordinary Markdown, laid out by the chosen split.</p>
    <ul>
      <li>One</li>
      <li>Two</li>
    </ul>
  </>
)

const Demo = ({ split }: { split: SplitName }) => (
  <Columns split={split}>
    {Array.from({ length: SPLITS[split].slots }, (_, i) => (
      <Column key={i}>
        <Prose heading={`Column ${i + 1}`} />
      </Column>
    ))}
  </Columns>
)

export const TwoEqual = () => <Demo split="two-equal" />
export const TwoWideLeft = () => <Demo split="two-wide-left" />
export const TwoWideRight = () => <Demo split="two-wide-right" />
export const Three = () => <Demo split="three" />
export const ThreeWideCenter = () => <Demo split="three-wide-center" />

export const AllSplits = () => (
  <>
    {SPLIT_NAMES.map((split) => (
      <section key={split} style={{ marginBlockEnd: '2rem' }}>
        <p>
          <code>{split}</code>
        </p>
        <Demo split={split} />
      </section>
    ))}
  </>
)
