import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { useAcceptBooking, useBookings, useCancelBooking, useDenyBooking } from './useBookings'
import { getApiError } from '../api/client'
import { useCurrentMembership } from '../auth/useCurrentMembership'
import { useBusiness } from '../businesses/useBusiness'
import { useToast } from '../components/ToastContext'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { ResponsiveTable } from '../components/ResponsiveTable'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { LoadingState } from '../components/LoadingState'
import { ErrorAlert } from '../components/ErrorAlert'
import { ConfirmationModal } from '../components/ConfirmationModal'
import { BOOKING_STATUSES, bookingStatusLabel, bookingStatusVariant } from '../lib/bookingStatus'
import { formatDateTimeRange } from '../lib/dateTime'

const CANCELLABLE_STATUSES = new Set([ 'pending', 'accepted' ])

export function BookingsPage() {
  const { businessSlug } = useParams()
  const membership = useCurrentMembership()
  const { data: business } = useBusiness(businessSlug)
  const isStaffOrAbove = Boolean(membership && [ 'owner', 'admin', 'staff' ].includes(membership.role))
  const canDecide = Boolean(membership && [ 'owner', 'admin' ].includes(membership.role))
  const canCancel = Boolean(membership && membership.role !== 'staff')
  const { showToast } = useToast()

  const [ statusFilter, setStatusFilter ] = useState(isStaffOrAbove ? 'pending' : 'all')
  const [ bookingToAccept, setBookingToAccept ] = useState(null)
  const [ bookingToDeny, setBookingToDeny ] = useState(null)
  const [ denyReason, setDenyReason ] = useState('')
  const [ bookingToCancel, setBookingToCancel ] = useState(null)

  const {
    data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage,
  } = useBookings(businessSlug, statusFilter)
  const cancelBooking = useCancelBooking(businessSlug)
  const acceptBooking = useAcceptBooking(businessSlug)
  const denyBooking = useDenyBooking(businessSlug)

  function confirmCancel() {
    cancelBooking.mutate(
      { bookingId: bookingToCancel.id, idempotencyKey: crypto.randomUUID() },
      { onSuccess: () => { showToast('Booking cancelled'); setBookingToCancel(null) } }
    )
  }

  function confirmAccept() {
    acceptBooking.mutate(
      { bookingId: bookingToAccept.id, idempotencyKey: crypto.randomUUID() },
      { onSuccess: () => { showToast('Booking accepted'); setBookingToAccept(null) } }
    )
  }

  function confirmDeny() {
    denyBooking.mutate(
      { bookingId: bookingToDeny.id, reason: denyReason, idempotencyKey: crypto.randomUUID() },
      {
        onSuccess: () => {
          showToast('Booking denied')
          setBookingToDeny(null)
          setDenyReason('')
        },
      }
    )
  }

  if (isLoading) return <LoadingState label="Loading bookings…" />
  if (isError) return <ErrorAlert message="Something went wrong loading bookings. Please try again." />

  const actionError = [ acceptBooking.error, denyBooking.error, cancelBooking.error ]
    .map((error) => error && getApiError(error))
    .find(Boolean)

  const visibleBookings = data.pages.flat()

  return (
    <>
      <PageHeader title={isStaffOrAbove ? 'Bookings Queue' : 'My Bookings'} />
      {actionError && <div className="mb-3"><ErrorAlert error={actionError} /></div>}

      <SectionCard className="mb-4">
        <Form.Group controlId="booking-status-filter" className="mb-0" style={{ maxWidth: '16rem' }}>
          <Form.Label>Status</Form.Label>
          <Form.Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All</option>
            {BOOKING_STATUSES.map((status) => (
              <option key={status} value={status}>{bookingStatusLabel(status)}</option>
            ))}
          </Form.Select>
        </Form.Group>
      </SectionCard>

      {visibleBookings.length === 0 ? (
        <SectionCard>
          <EmptyState title="No bookings" description="No bookings match this filter." />
        </SectionCard>
      ) : (
        <SectionCard>
          <ResponsiveTable>
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">Date / time range</th>
                <th scope="col">Pet(s)</th>
                {isStaffOrAbove && <th scope="col">Requested by</th>}
                <th scope="col">Status</th>
                <th scope="col" className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.service_offering.name}</td>
                  <td>{formatDateTimeRange(booking.requested_starts_at, booking.requested_ends_at, business?.time_zone)}</td>
                  <td>{booking.pets.map((pet) => pet.name).join(', ')}</td>
                  {isStaffOrAbove && <td>{booking.customer.email}</td>}
                  <td>
                    <StatusBadge label={bookingStatusLabel(booking.status)} variant={bookingStatusVariant(booking.status)} />
                    {booking.status === 'denied' && booking.denial_reason && (
                      <div className="small text-muted">{booking.denial_reason}</div>
                    )}
                  </td>
                  <td className="text-end">
                    <div className="d-flex gap-2 justify-content-end flex-wrap">
                      <Button as={Link} to={`/${businessSlug}/bookings/${booking.id}`} size="sm" variant="outline-secondary">
                        View
                      </Button>
                      {booking.status === 'pending' && canDecide && (
                        <>
                          <Button size="sm" variant="success" onClick={() => setBookingToAccept(booking)} disabled={acceptBooking.isPending}>
                            Accept
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => setBookingToDeny(booking)} disabled={denyBooking.isPending}>
                            Deny
                          </Button>
                        </>
                      )}
                      {CANCELLABLE_STATUSES.has(booking.status) && canCancel && (
                        <Button size="sm" variant="outline-danger" onClick={() => setBookingToCancel(booking)} disabled={cancelBooking.isPending}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </td>
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

      <ConfirmationModal
        show={bookingToAccept !== null}
        title="Accept booking"
        body={`Accept the ${bookingToAccept?.service_offering.name} request?`}
        confirmLabel="Accept"
        confirmVariant="success"
        onConfirm={confirmAccept}
        onCancel={() => setBookingToAccept(null)}
        isConfirming={acceptBooking.isPending}
      />

      <ConfirmationModal
        show={bookingToDeny !== null}
        title="Deny booking"
        body={(
          <>
            <p>Reason for denying the {bookingToDeny?.service_offering.name} request:</p>
            <Form.Control
              as="textarea"
              rows={3}
              value={denyReason}
              onChange={(event) => setDenyReason(event.target.value)}
              aria-label="Reason for denying this request"
            />
          </>
        )}
        confirmLabel="Deny"
        confirmVariant="danger"
        onConfirm={confirmDeny}
        onCancel={() => { setBookingToDeny(null); setDenyReason('') }}
        isConfirming={denyBooking.isPending}
        confirmDisabled={denyReason.trim() === ''}
      />

      <ConfirmationModal
        show={bookingToCancel !== null}
        title="Cancel booking"
        body={`Cancel the ${bookingToCancel?.service_offering.name} request?`}
        confirmLabel="Cancel booking"
        confirmVariant="danger"
        onConfirm={confirmCancel}
        onCancel={() => setBookingToCancel(null)}
        isConfirming={cancelBooking.isPending}
      />
    </>
  )
}

