import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ErrorAlert } from './ErrorAlert'

describe('ErrorAlert', () => {
  it('renders a plain message with no field details', () => {
    render(<ErrorAlert message="Could not reach the server." />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Could not reach the server.')
    expect(alert.querySelector('ul')).not.toBeInTheDocument()
  })

  it('renders field-level validation details from a structured error', () => {
    render(
      <ErrorAlert
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
      <ErrorAlert error={{ message: 'An account with this email already exists.' }}>
        <span> Follow-up</span>
      </ErrorAlert>
    )

    expect(screen.getByRole('alert')).toHaveTextContent('An account with this email already exists. Follow-up')
  })

  it('renders an optional title', () => {
    render(<ErrorAlert message="Something went wrong." title="Couldn't load pets" />)

    expect(screen.getByRole('heading', { name: "Couldn't load pets" })).toBeInTheDocument()
  })
})
