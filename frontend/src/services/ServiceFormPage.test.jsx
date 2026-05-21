import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ServiceFormPage } from './ServiceFormPage'
import { client } from '../api/client'

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, client: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }
})

function renderServiceFormPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ '/paws-and-play/services/new' ]}>
        <Routes>
          <Route path=":businessSlug/services/new" element={<ServiceFormPage />} />
          <Route path=":businessSlug/services" element={<p>Services page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ServiceFormPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a new service and returns to the services list', async () => {
    client.post.mockResolvedValue({ data: { id: 10, name: 'Grooming' } })
    const user = userEvent.setup()
    renderServiceFormPage()

    await user.type(screen.getByLabelText(/name/i), 'Grooming')
    await user.clear(screen.getByLabelText(/default capacity/i))
    await user.type(screen.getByLabelText(/default capacity/i), '3')
    await user.click(screen.getByRole('button', { name: /create service/i }))

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith('/businesses/paws-and-play/service_offerings', {
        service_offering: expect.objectContaining({
          name: 'Grooming',
          default_capacity: '3',
          service_kind: 'daycare',
        }),
      })
    })
    expect(await screen.findByText('Services page')).toBeInTheDocument()
  })
})
