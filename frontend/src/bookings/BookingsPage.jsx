import { useParams } from 'react-router-dom'
import { useBookings, useCancelBooking } from './useBookings'
import { getApiError } from '../api/client'

const CANCELLABLE_STATUSES = new Set([ 'pending', 'accepted' ])

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function BookingsPage() {
  const { businessSlug } = useParams()
  const { data: bookings, isLoading, isError } = useBookings(businessSlug)
  const cancelBooking = useCancelBooking(businessSlug)

  function handleCancel(booking) {
    if (!window.confirm(`Cancel your ${booking.service_offering.name} request?`)) return

    cancelBooking.mutate({ bookingId: booking.id, idempotencyKey: crypto.randomUUID() })
  }

  if (isLoading) return <p>Loading your bookings…</p>
  if (isError) return <p role="alert">Something went wrong loading your bookings. Please try again.</p>

  const cancelError = cancelBooking.error ? getApiError(cancelBooking.error) : null

  return (
    <section>
      <h2>My bookings</h2>
      {cancelError && <p role="alert">{cancelError.message}</p>}
      {bookings.length === 0 ? (
        <p>You don&apos;t have any bookings yet.</p>
      ) : (
        <ul>
          {bookings.map((booking) => (
            <li key={booking.id}>
              <strong>{booking.service_offering.name}</strong> — {booking.status}
              <br />
              {formatDateTime(booking.requested_starts_at)} to {formatDateTime(booking.requested_ends_at)}
              <br />
              Pets: {booking.pets.map((pet) => pet.name).join(', ')}
              {booking.status === 'denied' && booking.denial_reason && (
                <p>Reason: {booking.denial_reason}</p>
              )}
              {CANCELLABLE_STATUSES.has(booking.status) && (
                <button type="button" onClick={() => handleCancel(booking)} disabled={cancelBooking.isPending}>
                  Cancel
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
