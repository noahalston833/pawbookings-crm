import { useParams } from 'react-router-dom'
import { useAuditEvents } from './useAuditEvents'

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

function formatTimestamp(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function AuditLogPage() {
  const { businessSlug } = useParams()
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useAuditEvents(businessSlug)

  if (isLoading) return <p>Loading audit log…</p>
  if (isError) return <p role="alert">Something went wrong loading the audit log. Please try again.</p>

  const events = data.pages.flat()

  return (
    <section>
      <h2>Audit log</h2>
      {events.length === 0 ? (
        <p>No audited actions have happened yet.</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              {formatTimestamp(event.created_at)} — {ACTION_LABELS[event.action] ?? event.action}
              {' '}by {event.actor.email}
              {formatMetadata(event.metadata) && <p>{formatMetadata(event.metadata)}</p>}
            </li>
          ))}
        </ul>
      )}
      {hasNextPage && (
        <button type="button" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading…' : 'Load more'}
        </button>
      )}
    </section>
  )
}
