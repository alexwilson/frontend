import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import React, { StrictMode } from 'react'

afterEach(cleanup)

import { Uuid } from '../uuid'

type WidgetProps = React.ComponentProps<typeof Uuid>

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const props = (overrides: Partial<WidgetProps> & { locale?: string } = {}): WidgetProps => ({
  value: '',
  field: undefined as never,
  onChange: vi.fn(),
  forID: 'id',
  classNameWrapper: 'wrap',
  ...overrides,
}) as WidgetProps

describe('Uuid widget', () => {
  describe('initial minting', () => {
    it('mints a UUID when value is empty and i18n is disabled', () => {
      const onChange = vi.fn()
      render(<Uuid {...props({ onChange })} />)
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange.mock.calls[0][0]).toMatch(UUID_V4)
    })

    it('mints a UUID when value is empty in the default-locale pane', () => {
      const onChange = vi.fn()
      render(<Uuid {...props({ locale: 'en', onChange })} />)
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange.mock.calls[0][0]).toMatch(UUID_V4)
    })

    it('leaves an existing value alone when i18n is disabled', () => {
      const onChange = vi.fn()
      render(<Uuid {...props({ value: '0297a9c9-c802-45c1-99a9-8b09fd099349', onChange })} />)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('leaves an existing value alone in the default-locale pane', () => {
      const onChange = vi.fn()
      render(<Uuid {...props({ value: '0297a9c9-c802-45c1-99a9-8b09fd099349', locale: 'en', onChange })} />)
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('i18n non-default locale', () => {
    it('does not mint in a non-default-locale pane when value is empty', () => {
      const onChange = vi.fn()
      render(<Uuid {...props({ locale: 'ja', onChange })} />)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('does not mint in a non-default-locale pane when a value already exists', () => {
      const onChange = vi.fn()
      render(<Uuid {...props({ value: '0297a9c9-c802-45c1-99a9-8b09fd099349', locale: 'ja', onChange })} />)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('does not mint in a non-default-locale pane even after a duplicate-synced value is later cleared', () => {
      const onChange = vi.fn()
      const { rerender } = render(<Uuid {...props({ value: '', locale: 'ja', onChange })} />)
      rerender(<Uuid {...props({ value: '0297a9c9-c802-45c1-99a9-8b09fd099349', locale: 'ja', onChange })} />)
      rerender(<Uuid {...props({ value: '', locale: 'ja', onChange })} />)
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('lifetime lock-in (anti-rotation)', () => {
    it('does not re-mint after minting if the value is later cleared', () => {
      const onChange = vi.fn()
      const { rerender } = render(<Uuid {...props({ value: '', onChange })} />)
      const minted = onChange.mock.calls[0][0]
      rerender(<Uuid {...props({ value: minted, onChange })} />)
      rerender(<Uuid {...props({ value: '', onChange })} />)
      expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('does not mint when mounted with a value that is later cleared', () => {
      const onChange = vi.fn()
      const { rerender } = render(<Uuid {...props({ value: '0297a9c9-c802-45c1-99a9-8b09fd099349', onChange })} />)
      rerender(<Uuid {...props({ value: '', onChange })} />)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('mints exactly once under React strict-mode effect replay', () => {
      const onChange = vi.fn()
      render(
        <StrictMode>
          <Uuid {...props({ onChange })} />
        </StrictMode>,
      )
      expect(onChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('rendering', () => {
    it('renders the value in the hidden input and visibly', () => {
      const value = '0297a9c9-c802-45c1-99a9-8b09fd099349'
      const { container } = render(<Uuid {...props({ value, onChange: vi.fn() })} />)
      const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
      expect(hidden?.value).toBe(value)
      expect(screen.getByText(value)).toBeTruthy()
    })
  })
})
