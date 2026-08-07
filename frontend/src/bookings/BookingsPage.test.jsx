import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BookingsPage } from './BookingsPage'
import { AuthProvider } from '../auth/AuthContext'
import { ToastProvider } from '../components/ToastContext'
import { client } from '../api/client'

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, client: { get: vi.fn(), post: vi.fn() } }
})

const BOOKINGS_URL = '/businesses/paws-and-play/bookings'

const PENDING_BOOKING = {
  id: 1,
  status: 'pending',
  requested_starts_at: '2026-09-01T09:00:00Z',
  requested_ends_at: '2026-09-01T17:00:00Z',
  notes: null,
  denial_reason: null,
  service_offering: { id: 5, name: 'Daycare' },
  customer: { id: 9, email: 'customer@example.com' },
  pets: [ { id: 1, name: 'Rex' } ],
}

const CUSTOMER_USER = {
  id: 9,
  email: 'customer@example.com',
  memberships: [ { business_slug: 'paws-and-play', business_name: 'Paws & Play', role: 'customer' } ],
}

const OWNER_USER = {
  id: 1,
  email: 'owner@example.com',
  memberships: [ { business_slug: 'paws-and-play', business_name: 'Paws & Play', role: 'owner' } ],
}

function renderBookingsPage({ user }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.get.mockImplementation((url) => {
    if (url === '/session') return Promise.resolve({ data: { user } })
    if (url === BOOKINGS_URL) return Promise.resolve({ data: [ PENDING_BOOKING ] })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ '/paws-and-play/bookings' ]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path=":businessSlug/bookings" element={<BookingsPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('BookingsPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows a customer their own bookings without accept/deny controls', async () => {
    renderBookingsPage({ user: CUSTOMER_USER })

    expect(await screen.findByRole('heading', { name: /my bookings/i })).toBeInTheDocument()
    expect(screen.getByText('Daycare', { exact: false })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^accept$/i })).not.toBeInTheDocument()
  })

  it('lets an owner accept a pending booking', async () => {
    client.post.mockResolvedValue({ data: { ...PENDING_BOOKING, status: 'accepted' } })
    const user = userEvent.setup()
    renderBookingsPage({ user: OWNER_USER })

    expect(await screen.findByRole('heading', { name: /bookings queue/i })).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: /^accept$/i }))

    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /^accept$/i }))

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith(
        '/businesses/paws-and-play/bookings/1/accept',
        {},
        { headers: { 'Idempotency-Key': expect.any(String) } }
      )
    })
  })
})
