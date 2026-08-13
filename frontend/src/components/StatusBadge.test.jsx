import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders the label as text, not just a color', () => {
    render(<StatusBadge label="Accepted" variant="success" />)

    expect(screen.getByText('Accepted')).toBeInTheDocument()
  })

  it('applies the subtle background/text/border classes for the given variant', () => {
    render(<StatusBadge label="Pending" variant="warning" />)

    const badge = screen.getByText('Pending').closest('span')
    expect(badge).toHaveClass('bg-warning-subtle', 'text-warning-emphasis', 'border-warning-subtle')
  })

  it('hides the decorative dot from assistive tech', () => {
    render(<StatusBadge label="Denied" variant="danger" />)

    const dot = document.querySelector('.status-badge__dot')
    expect(dot).toHaveAttribute('aria-hidden', 'true')
  })

  it('defaults to the secondary variant when none is given', () => {
    render(<StatusBadge label="Cancelled" />)

    const badge = screen.getByText('Cancelled').closest('span')
    expect(badge).toHaveClass('bg-secondary-subtle')
  })
})
