import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ApiErrorAlert } from './ApiErrorAlert'

describe('ApiErrorAlert', () => {
  it('renders the message alone when there are no field details', () => {
    render(<ApiErrorAlert error={{ message: 'Could not reach the server.' }} />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Could not reach the server.')
    expect(alert.querySelector('ul')).not.toBeInTheDocument()
  })

  it('renders field-level validation details alongside the message', () => {
    render(
      <ApiErrorAlert
        error={{
          message: 'The request could not be processed.',
          details: { slug: [ 'must be lowercase letters, numbers, and hyphens only' ] },
        }}
      />
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('The request could not be processed.')
    expect(alert).toHaveTextContent('slug: must be lowercase letters, numbers, and hyphens only')
  })

  it('renders extra children (e.g. a follow-up link) alongside the message', () => {
    render(
      <ApiErrorAlert error={{ message: 'An account with this email already exists.' }}>
        <span> Follow-up</span>
      </ApiErrorAlert>
    )

    expect(screen.getByRole('alert')).toHaveTextContent('An account with this email already exists. Follow-up')
  })
})
