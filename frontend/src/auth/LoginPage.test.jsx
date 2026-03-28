import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'
import { AuthProvider } from './AuthContext'
import { client } from '../api/client'

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, client: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }
})

function renderLoginPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ '/login' ]}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Simulates "not logged in yet" for the currentUser query the
    // AuthProvider fires on mount.
    client.get.mockRejectedValue({ response: { status: 401 } })
  })

  it('submits the entered credentials', async () => {
    client.post.mockResolvedValue({ data: { user: { id: 1, email: 'owner@example.com', memberships: [] } } })
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), 'owner@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith('/session', {
        session: { email: 'owner@example.com', password: 'password123' },
      })
    })
  })

  it('shows the server error message on invalid credentials', async () => {
    client.post.mockRejectedValue({
      response: { data: { error: { code: 'invalid_credentials', message: 'Email or password is incorrect.' } } },
    })
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), 'owner@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect/i)
  })
})
