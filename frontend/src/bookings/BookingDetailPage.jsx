import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { useAcceptBooking, useBooking, useCancelBooking, useDenyBooking } from './useBookings'
import { useBusiness } from '../businesses/useBusiness'
import { useCurrentMembership } from '../auth/useCurrentMembership'
import { useServiceOffering } from '../services/useServices'
import { getApiError } from '../api/client'
import { useToast } from '../components/ToastContext'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { StatusBadge } from '../components/StatusBadge'
import { LoadingState } from '../components/LoadingState'
import { ErrorAlert } from '../components/ErrorAlert'
import { ConfirmationModal } from '../components/ConfirmationModal'
import { bookingStatusLabel, bookingStatusVariant } from '../lib/bookingStatus'
import { serviceKindLabel } from '../lib/serviceKind'
import { formatDateTimeRange } from '../lib/dateTime'

const CANCELLABLE_STATUSES = new Set([ 'pending', 'accepted' ])

export function BookingDetailPage() {
  const { businessSlug, bookingId } = useParams()
  const navigate = useNavigate()
  const membership = useCurrentMembership()
  const isStaffOrAbove = Boolean(membership && [ 'owner', 'admin', 'staff' ].includes(membership.role))
  const canDecide = Boolean(membership && [ 'owner', 'admin' ].includes(membership.role))
  const canCancel = Boolean(membership && membership.role !== 'staff')
  const { showToast } = useToast()

  const { data: booking, isLoading, isError } = useBooking(businessSlug, bookingId)
  const { data: business } = useBusiness(businessSlug)
  const { data: service } = useServiceOffering(businessSlug, booking?.service_offering.id)
  const acceptBooking = useAcceptBooking(businessSlug)
  const denyBooking = useDenyBooking(businessSlug)
  const cancelBooking = useCancelBooking(businessSlug)

  const [ showAccept, setShowAccept ] = useState(false)
  const [ showDeny, setShowDeny ] = useState(false)
  const [ denyReason, setDenyReason ] = useState('')
  const [ showCancel, setShowCancel ] = useState(false)

  function returnToList(message) {
    showToast(message)
    navigate(`/${businessSlug}/bookings`)
  }

  function confirmAccept() {
    acceptBooking.mutate(
      { bookingId: booking.id, idempotencyKey: crypto.randomUUID() },
      { onSuccess: () => returnToList('Booking accepted') }
    )
  }

  function confirmDeny() {
    denyBooking.mutate(
      { bookingId: booking.id, reason: denyReason, idempotencyKey: crypto.randomUUID() },
      { onSuccess: () => returnToList('Booking denied') }
    )
  }

  function confirmCancel() {
    cancelBooking.mutate(
      { bookingId: booking.id, idempotencyKey: crypto.randomUUID() },
      { onSuccess: () => returnToList('Booking cancelled') }
    )
  }

  if (isLoading) return <LoadingState label="Loading booking…" />
  if (isError) return <ErrorAlert message="Something went wrong loading this booking. Please try again." />

  const error = [ acceptBooking.error, denyBooking.error, cancelBooking.error ]
    .map((mutationError) => mutationError && getApiError(mutationError))
    .find(Boolean)

  return (
    <>
      <PageHeader
        title={`Booking: ${booking.service_offering.name}`}
        breadcrumbs={[ { label: 'Bookings', to: `/${businessSlug}/bookings` }, { label: `#${booking.id}` } ]}
      />

      {error && <div className="mb-3"><ErrorAlert error={error} /></div>}

      <SectionCard title="Summary" className="mb-4">
        <dl className="row mb-0">
          <dt className="col-sm-3">Status</dt>
          <dd className="col-sm-9"><StatusBadge label={bookingStatusLabel(booking.status)} variant={bookingStatusVariant(booking.status)} /></dd>
          <dt className="col-sm-3">Service</dt>
          <dd className="col-sm-9">{booking.service_offering.name}{service && ` (${serviceKindLabel(service.service_kind)})`}</dd>
          <dt className="col-sm-3">Requested time</dt>
          <dd className="col-sm-9">{formatDateTimeRange(booking.requested_starts_at, booking.requested_ends_at, business?.time_zone)}</dd>
          {isStaffOrAbove && (
            <>
              <dt className="col-sm-3">Requested by</dt>
              <dd className="col-sm-9">{booking.customer.email}</dd>
            </>
          )}
          <dt className="col-sm-3">Pet(s)</dt>
          <dd className="col-sm-9">{booking.pets.map((pet) => pet.name).join(', ')}</dd>
          {booking.notes && (
            <>
              <dt className="col-sm-3">Notes</dt>
              <dd className="col-sm-9">{booking.notes}</dd>
            </>
          )}
          {booking.status === 'denied' && booking.denial_reason && (
            <>
              <dt className="col-sm-3">Denial reason</dt>
              <dd className="col-sm-9">{booking.denial_reason}</dd>
            </>
          )}
        </dl>
      </SectionCard>

      <div className="d-flex gap-2 flex-wrap">
        <Button as={Link} to={`/${businessSlug}/bookings`} variant="outline-secondary">
          Back to bookings
        </Button>
        {booking.status === 'pending' && canDecide && (
          <>
            <Button variant="success" onClick={() => setShowAccept(true)} disabled={acceptBooking.isPending}>
              Accept
            </Button>
            <Button variant="outline-danger" onClick={() => setShowDeny(true)} disabled={denyBooking.isPending}>
              Deny
            </Button>
          </>
        )}
        {CANCELLABLE_STATUSES.has(booking.status) && canCancel && (
          <Button variant="outline-danger" onClick={() => setShowCancel(true)} disabled={cancelBooking.isPending}>
            Cancel
          </Button>
        )}
      </div>

      <ConfirmationModal
        show={showAccept}
        title="Accept booking"
        body={`Accept the ${booking.service_offering.name} request?`}
        confirmLabel="Accept"
        confirmVariant="success"
        onConfirm={confirmAccept}
        onCancel={() => setShowAccept(false)}
        isConfirming={acceptBooking.isPending}
      />

      <ConfirmationModal
        show={showDeny}
        title="Deny booking"
        body={(
          <>
            <p>Reason for denying the {booking.service_offering.name} request:</p>
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
        onCancel={() => { setShowDeny(false); setDenyReason('') }}
        isConfirming={denyBooking.isPending}
        confirmDisabled={denyReason.trim() === ''}
      />

      <ConfirmationModal
        show={showCancel}
        title="Cancel booking"
        body={`Cancel the ${booking.service_offering.name} request?`}
        confirmLabel="Cancel booking"
        confirmVariant="danger"
        onConfirm={confirmCancel}
        onCancel={() => setShowCancel(false)}
        isConfirming={cancelBooking.isPending}
      />
    </>
  )
}
