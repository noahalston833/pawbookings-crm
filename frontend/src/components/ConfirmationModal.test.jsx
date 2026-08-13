import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmationModal } from './ConfirmationModal'

describe('ConfirmationModal', () => {
  it('renders nothing visible when show is false', () => {
    render(
      <ConfirmationModal
        show={false}
        title="Archive pet"
        body="Archive Rex?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the title and body, and calls onConfirm/onCancel', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(
      <ConfirmationModal
        show
        title="Archive pet"
        body="Archive Rex?"
        confirmLabel="Archive"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Archive pet')
    expect(dialog).toHaveTextContent('Archive Rex?')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Archive' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('disables both buttons and shows a waiting label while confirming', () => {
    render(
      <ConfirmationModal
        show
        title="Cancel booking"
        body="Cancel this booking?"
        confirmLabel="Cancel booking"
        onConfirm={() => {}}
        onCancel={() => {}}
        isConfirming
      />
    )

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /please wait/i })).toBeDisabled()
  })

  it('disables only the confirm button when confirmDisabled is set', () => {
    render(
      <ConfirmationModal
        show
        title="Deny booking"
        body="Reason required"
        confirmLabel="Deny"
        onConfirm={() => {}}
        onCancel={() => {}}
        confirmDisabled
      />
    )

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Deny' })).toBeDisabled()
  })
})
