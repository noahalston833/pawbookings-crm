import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MembershipsPage } from './MembershipsPage'
import { AuthProvider } from '../auth/AuthContext'
import { ToastProvider } from '../components/ToastContext'
import { client } from '../api/client'

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, client: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }
})

const MEMBERSHIPS_URL = '/businesses/paws-and-play/memberships'

const MEMBERSHIPS = [
  { id: 1, role: 'owner', user: { id: 1, email: 'owner@example.com' } },
  { id: 2, role: 'staff', user: { id: 2, email: 'staff@example.com' } },
]

const ADMIN_USER = {
  id: 3,
  email: 'admin@example.com',
  memberships: [ { business_slug: 'paws-and-play', business_name: 'Paws & Play', role: 'admin' } ],
}

function renderMembershipsPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.get.mockImplementation((url) => {
    if (url === '/session') return Promise.resolve({ data: { user: ADMIN_USER } })
    if (url === MEMBERSHIPS_URL) return Promise.resolve({ data: MEMBERSHIPS })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ '/paws-and-play/members' ]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path=":businessSlug/members" element={<MembershipsPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('MembershipsPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the owner row as read-only for an admin viewer', async () => {
    renderMembershipsPage()

    await screen.findByText('owner@example.com', { exact: false })
    // Only the non-owner (staff) row offers a role select -- an admin
    // can't touch an owner's membership at all (MembershipPolicy).
    expect(screen.getAllByRole('combobox')).toHaveLength(1)
  })

  it("lets an admin change a non-owner member's role", async () => {
    client.patch.mockResolvedValue({ data: { ...MEMBERSHIPS[1], role: 'admin' } })
    const user = userEvent.setup()
    renderMembershipsPage()

    const select = await screen.findByLabelText('Role')
    expect(screen.queryByRole('option', { name: 'owner' })).not.toBeInTheDocument()

    await user.selectOptions(select, 'admin')

    await waitFor(() => {
      expect(client.patch).toHaveBeenCalledWith(
        '/businesses/paws-and-play/memberships/2',
        { membership: { role: 'admin' } }
      )
    })
  })
})
