import React from 'react'
import { type SplitName } from '@alexwilson/content'

import { COLUMNS_CLASS, COLUMN_CLASS } from './contract'
import './columns.scss'

export function Columns({
  split,
  children,
}: {
  split: SplitName
  children: React.ReactNode
}) {
  return (
    <div className={COLUMNS_CLASS} data-split={split}>
      {children}
    </div>
  )
}

export function Column({
  lang,
  children,
}: {
  lang?: string
  children: React.ReactNode
}) {
  return (
    <div className={COLUMN_CLASS} lang={lang}>
      {children}
    </div>
  )
}
