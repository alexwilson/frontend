import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

import { Uuid } from '../uuid'

type WidgetProps = React.ComponentProps<typeof Uuid>

const props = (overrides: Partial<WidgetProps> & { locale?: string } = {}): WidgetProps => ({
  value: '',
  field: undefined as never,
  onChange: vi.fn(),
  forID: 'id',
  classNameWrapper: 'wrap',
  ...overrides,
}) as WidgetProps

describe('Uuid widget', () => {
  it('mints a UUID when no value exists', () => {
    const onChange = vi.fn()
    render(<Uuid {...props({ onChange })} />)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('leaves an existing value alone', () => {
    const onChange = vi.fn()
    render(<Uuid {...props({ value: '0297a9c9-c802-45c1-99a9-8b09fd099349', onChange })} />)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not regenerate when the value is later cleared on re-render', () => {
    const onChange = vi.fn()
    const { rerender } = render(<Uuid {...props({ value: 'existing', onChange })} />)
    rerender(<Uuid {...props({ value: '', onChange })} />)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('mints in the default-locale pane (en)', () => {
    const onChange = vi.fn()
    render(<Uuid {...props({ locale: 'en', onChange })} />)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('does not mint in a non-default-locale pane (ja)', () => {
    const onChange = vi.fn()
    render(<Uuid {...props({ locale: 'ja', onChange })} />)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('mints when locale is undefined (i18n disabled)', () => {
    const onChange = vi.fn()
    render(<Uuid {...props({ onChange })} />)
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
