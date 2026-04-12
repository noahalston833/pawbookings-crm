import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BookingRequestPage } from './BookingRequestPage'
import { client } from '../api/client'

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, client: { get: vi.fn(), post: vi.fn() } }
})

const SERVICE_URL = '/businesses/paws-and-play/service_offerings/5'
const AVAILABILITY_URL = '/businesses/paws-and-play/service_offerings/5/availability'
const PETS_URL = '/businesses/paws-and-play/pets'

function mockSuccessfulLookups({ remainingCapacity = 5 } = {}) {
  client.get.mockImplementation((url) => {
    if (url === AVAILABILITY_URL) {
      return Promise.resolve({
        data: {
          time_zone: 'UTC',
          slots: [
            {
              id: 1, starts_at: '2026-09-01T09:00:00Z', ends_at: '2026-09-01T17:00:00Z',
              capacity: 5, remaining_capacity: remainingCapacity,
            },
          ],
        },
      })
    }
    if (url === SERVICE_URL) {
      return Promise.resolve({ data: { id: 5, name: 'Daycare', customer_facing_instructions: '' } })
    }
    if (url === PETS_URL) {
      return Promise.resolve({ data: [ { id: 9, name: 'Rex', status: 'active' } ] })
    }
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

function renderBookingRequestPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ '/paws-and-play/services/5/book' ]}>
        <Routes>
          <Route path=":businessSlug/services/:serviceOfferingId/book" element={<BookingRequestPage />} />
          <Route path=":businessSlug/bookings" element={<p>Bookings page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('BookingRequestPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('disables submission until a slot and a pet are selected', async () => {
    mockSuccessfulLookups()
    renderBookingRequestPage()

    expect(await screen.findByRole('button', { name: /request booking/i })).toBeDisabled()
  })

  it('submits the selected slot and pet with an Idempotency-Key header', async () => {
    mockSuccessfulLookups()
    client.post.mockResolvedValue({ data: { id: 42, status: 'pending' } })
    const user = userEvent.setup()
    renderBookingRequestPage()

    await user.click(await screen.findByLabelText(/Rex/))
    await user.click(screen.getByLabelText(/remaining/))
    await user.click(screen.getByRole('button', { name: /request booking/i }))

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith(
        '/businesses/paws-and-play/bookings',
        { booking: expect.objectContaining({ service_offering_id: 5, pet_ids: [ 9 ] }) },
        { headers: { 'Idempotency-Key': expect.any(String) } }
      )
    })
    expect(await screen.findByText('Bookings page')).toBeInTheDocument()
  })

  it('disables an already-full slot', async () => {
    mockSuccessfulLookups({ remainingCapacity: 0 })
    renderBookingRequestPage()

    expect(await screen.findByLabelText(/remaining/)).toBeDisabled()
  })
})
