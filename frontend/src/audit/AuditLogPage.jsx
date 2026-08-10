import { useParams } from 'react-router-dom'
import Button from 'react-bootstrap/Button'
import { useAuditEvents } from './useAuditEvents'
import { useBusiness } from '../businesses/useBusiness'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { ResponsiveTable } from '../components/ResponsiveTable'
import { EmptyState } from '../components/EmptyState'
import { LoadingState } from '../components/LoadingState'
import { ErrorAlert } from '../components/ErrorAlert'
import { formatDateTime } from '../lib/dateTime'

const ACTION_LABELS = {
  'booking.accepted': 'Booking accepted',
  'booking.denied': 'Booking denied',
  'membership.role_changed': 'Member role changed',
  'business.settings_changed': 'Business settings changed',
}

function formatMetadata(metadata) {
  const entries = Object.entries(metadata ?? {})
  if (entries.length === 0) return null

  return entries
    .map(([ key, value ]) => `${key}: ${typeof value === 'object' && value !== null ? JSON.stringify(value) : value}`)
    .join(', ')
}

export function AuditLogPage() {
  const { businessSlug } = useParams()
  const { data: business } = useBusiness(businessSlug)
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useAuditEvents(businessSlug)

  if (isLoading) return <LoadingState label="Loading audit log…" />
  if (isError) return <ErrorAlert message="Something went wrong loading the audit log. Please try again." />

  const events = data.pages.flat()

  return (
    <>
      <PageHeader title="Audit Log" description="Every accept/deny decision, role change, and settings change at this business." />

      {events.length === 0 ? (
        <SectionCard>
          <EmptyState title="Nothing here yet" description="No audited actions have happened yet." />
        </SectionCard>
      ) : (
        <SectionCard>
          <ResponsiveTable>
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Action</th>
                <th scope="col">By</th>
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{formatDateTime(event.created_at, business?.time_zone)}</td>
                  <td>{ACTION_LABELS[event.action] ?? event.action}</td>
                  <td>{event.actor.email}</td>
                  <td>{formatMetadata(event.metadata) ?? '\u2014'}</td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        </SectionCard>
      )}

      {hasNextPage && (
        <div className="mt-3">
          <Button variant="outline-secondary" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </>
  )
}

