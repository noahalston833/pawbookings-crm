import { useCurrentMembership } from '../auth/useCurrentMembership'
import { CustomerDashboardPage } from './CustomerDashboardPage'
import { BusinessDashboardPage } from './BusinessDashboardPage'

// The index route for a business: customers get a booking-focused
// summary, staff+ get an operational one -- same route, role decides
// which is rendered (see docs/authorization.md).
export function DashboardPage() {
  const membership = useCurrentMembership()

  if (membership && [ 'owner', 'admin', 'staff' ].includes(membership.role)) {
    return <BusinessDashboardPage />
  }

  return <CustomerDashboardPage />
}
