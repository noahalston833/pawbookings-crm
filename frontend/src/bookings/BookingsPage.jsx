import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAcceptBooking, useBookings, useCancelBooking, useDenyBooking } from './useBookings'
import { getApiError } from '../api/client'
import { ApiErrorAlert } from '../components/ApiErrorAlert'
import { useCurrentMembership } from '../auth/useCurrentMembership'

const CANCELLABLE_STATUSES = new Set([ 'pending', 'accepted' ])
const FILTERABLE_STATUSES = [ 'pending', 'accepted', 'denied', 'cancelled', 'completed' ]

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function BookingsPage() {
  const { businessSlug } = useParams()
  const membership = useCurrentMembership()
  const isStaffOrAbove = Boolean(membership && [ 'owner', 'admin', 'staff' ].includes(membership.role))
  const canDecide = Boolean(membership && [ 'owner', 'admin' ].includes(membership.role))
  const canCancel = Boolean(membership && membership.role !== 'staff')

  const [ statusFilter, setStatusFilter ] = useState(isStaffOrAbove ? 'pending' : 'all')

  const {
    data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage,
  } = useBookings(businessSlug, statusFilter)
  const cancelBooking = useCancelBooking(businessSlug)
  const acceptBooking = useAcceptBooking(businessSlug)
  const denyBooking = useDenyBooking(businessSlug)

  function handleCancel(booking) {
    if (!window.confirm(`Cancel the ${booking.service_offering.name} request?`)) return

    cancelBooking.mutate({ bookingId: booking.id, idempotencyKey: crypto.randomUUID() })
  }

  function handleAccept(booking) {
    acceptBooking.mutate({ bookingId: booking.id, idempotencyKey: crypto.randomUUID() })
  }

  function handleDeny(booking) {
    const reason = window.prompt('Reason for denying this request:')
    if (reason === null || reason.trim() === '') return

    denyBooking.mutate({ bookingId: booking.id, reason, idempotencyKey: crypto.randomUUID() })
  }

  if (isLoading) return <p>Loading bookings…</p>
  if (isError) return <p role="alert">Something went wrong loading bookings. Please try again.</p>

  const actionError = [ acceptBooking.error, denyBooking.error, cancelBooking.error ]
    .map((error) => error && getApiError(error))
    .find(Boolean)

  const visibleBookings = data.pages.flat()

  return (
    <section>
      <h2>{isStaffOrAbove ? 'Bookings queue' : 'My bookings'}</h2>
      {actionError && <ApiErrorAlert error={actionError} />}

      <p>
        <label htmlFor="booking-status-filter">Status</label>
        {' '}
        <select
          id="booking-status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All</option>
          {FILTERABLE_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </p>

      {visibleBookings.length === 0 ? (
        <p>No bookings match this filter.</p>
      ) : (
        <ul>
          {visibleBookings.map((booking) => (
            <li key={booking.id}>
              <strong>{booking.service_offering.name}</strong> — {booking.status}
              <br />
              {formatDateTime(booking.requested_starts_at)} to {formatDateTime(booking.requested_ends_at)}
              <br />
              Pets: {booking.pets.map((pet) => pet.name).join(', ')}
              {isStaffOrAbove && (
                <>
                  <br />
                  Requested by: {booking.customer.email}
                </>
              )}
              {booking.notes && <p>Notes: {booking.notes}</p>}
              {booking.status === 'denied' && booking.denial_reason && (
                <p>Reason: {booking.denial_reason}</p>
              )}
              {booking.status === 'pending' && canDecide && (
                <p>
                  <button type="button" onClick={() => handleAccept(booking)} disabled={acceptBooking.isPending}>
                    Accept
                  </button>
                  {' '}
                  <button type="button" onClick={() => handleDeny(booking)} disabled={denyBooking.isPending}>
                    Deny
                  </button>
                </p>
              )}
              {CANCELLABLE_STATUSES.has(booking.status) && canCancel && (
                <button type="button" onClick={() => handleCancel(booking)} disabled={cancelBooking.isPending}>
                  Cancel
                </button>
              )}
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
