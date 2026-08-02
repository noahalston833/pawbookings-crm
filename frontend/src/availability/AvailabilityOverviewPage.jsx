import { Link, useParams } from 'react-router-dom'
import Button from 'react-bootstrap/Button'
import { useBusiness } from '../businesses/useBusiness'
import { useCurrentMembership } from '../auth/useCurrentMembership'
import { useAllAvailabilitySlots } from './useAllAvailabilitySlots'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { ResponsiveTable } from '../components/ResponsiveTable'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { LoadingState } from '../components/LoadingState'
import { ErrorAlert } from '../components/ErrorAlert'
import { formatDateTimeRange } from '../lib/dateTime'

// A combined, read-only view across every service's slots -- editing a
// specific slot still happens on its service's management page (linked
// from here), rather than duplicating that form in two places. This
// admin-facing endpoint only ever returns a slot's total `capacity` and
// `active` flag (not a computed remaining/reserved count -- that's only
// available from the customer-facing availability endpoint), so this
// table shows total capacity and an Active/Inactive status rather than
// an Available/Limited/Full breakdown.
export function AvailabilityOverviewPage() {
  const { businessSlug } = useParams()
  const { data: business } = useBusiness(businessSlug)
  const membership = useCurrentMembership()
  const canManage = Boolean(membership && [ 'owner', 'admin' ].includes(membership.role))
  const { services, slots, isLoading, isError } = useAllAvailabilitySlots(businessSlug)

  if (isLoading) return <LoadingState label="Loading availability…" />
  if (isError) return <ErrorAlert message="Something went wrong loading availability. Please try again." />

  const sortedSlots = [ ...slots ].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))

  return (
    <>
      <PageHeader
        title="Availability"
        description="Every scheduled slot across every service, in the business's time zone."
      />
      <SectionCard>
        {sortedSlots.length === 0 ? (
          <EmptyState
            title="No availability scheduled yet"
            description="Add availability from a service's management page."
            action={services[0] && (
              <Button as={Link} to={`/${businessSlug}/services/${services[0].id}/slots`} variant="primary">
                Manage availability
              </Button>
            )}
          />
        ) : (
          <ResponsiveTable>
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">Date / time range</th>
                <th scope="col">Capacity</th>
                <th scope="col">Status</th>
                {canManage && <th scope="col" className="text-end">Action</th>}
              </tr>
            </thead>
            <tbody>
              {sortedSlots.map((slot) => (
                <tr key={slot.id}>
                  <td>{slot.service.name}</td>
                  <td>{formatDateTimeRange(slot.starts_at, slot.ends_at, business?.time_zone)}</td>
                  <td>{slot.capacity}</td>
                  <td><StatusBadge label={slot.active ? 'Active' : 'Inactive'} variant={slot.active ? 'success' : 'secondary'} /></td>
                  {canManage && (
                    <td className="text-end">
                      <Button
                        as={Link}
                        to={`/${businessSlug}/services/${slot.service.id}/slots`}
                        size="sm"
                        variant="outline-secondary"
                      >
                        Edit
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        )}
      </SectionCard>
    </>
  )
}

