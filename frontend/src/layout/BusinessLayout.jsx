import { Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useCurrentMembership } from '../auth/useCurrentMembership'
import { useBusiness } from '../businesses/useBusiness'
import { AppShell } from '../components/AppShell'
import { LoadingState } from '../components/LoadingState'
import { buildBusinessNavItems } from '../lib/businessNavigation'
import { roleLabel } from '../lib/roleLabels'

export function BusinessLayout() {
  const { businessSlug } = useParams()
  const { user, logout } = useAuth()
  const { data: business, isLoading } = useBusiness(businessSlug)
  const membership = useCurrentMembership()

  return (
    <AppShell
      homeTo="/"
      businessName={business?.name ?? businessSlug}
      navItems={buildBusinessNavItems(businessSlug, membership?.role)}
      userEmail={user.email}
      roleLabel={roleLabel(membership?.role)}
      onLogout={() => logout()}
    >
      {isLoading ? <LoadingState label="Loading business…" /> : <Outlet />}
    </AppShell>
  )
}
