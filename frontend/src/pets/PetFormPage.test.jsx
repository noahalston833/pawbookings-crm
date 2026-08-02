import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PetFormPage } from './PetFormPage'
import { AuthProvider } from '../auth/AuthContext'
import { ToastProvider } from '../components/ToastContext'
import { client } from '../api/client'

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, client: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }
})

const CUSTOMER_USER = {
  id: 9,
  email: 'customer@example.com',
  memberships: [ { business_slug: 'paws-and-play', business_name: 'Paws & Play', role: 'customer' } ],
}

function renderPetFormPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.get.mockImplementation((url) => {
    if (url === '/session') return Promise.resolve({ data: { user: CUSTOMER_USER } })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ '/paws-and-play/pets/new' ]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path=":businessSlug/pets/new" element={<PetFormPage />} />
              <Route path=":businessSlug/pets" element={<p>Pets page</p>} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('PetFormPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('submits the pet as a dog and navigates to the pets list on success', async () => {
    client.post.mockResolvedValue({ data: { id: 1, name: 'Rex', species: 'dog' } })
    const user = userEvent.setup()
    renderPetFormPage()

    await user.type(await screen.findByLabelText(/^name/i), 'Rex')
    await user.click(screen.getByRole('button', { name: /save pet/i }))

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith(
        '/businesses/paws-and-play/pets',
        expect.objectContaining({ pet: expect.objectContaining({ name: 'Rex', species: 'dog' }) })
      )
    })
    expect(await screen.findByText('Pets page')).toBeInTheDocument()
  })

  it('shows a validation error returned by the server', async () => {
    client.post.mockRejectedValue({
      response: {
        data: {
          error: {
            code: 'validation_failed',
            message: 'The request could not be processed.',
            details: { name: [ "can't be blank" ] },
          },
        },
      },
    })
    const user = userEvent.setup()
    renderPetFormPage()

    await user.type(await screen.findByLabelText(/^name/i), 'Rex')
    await user.click(screen.getByRole('button', { name: /save pet/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be processed/i)
  })
})
