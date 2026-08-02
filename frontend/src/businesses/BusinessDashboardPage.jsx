import { Link, useParams } from 'react-router-dom'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import { useBusiness } from '../businesses/useBusiness'
import { useBookings } from '../bookings/useBookings'
import { usePublicAvailability } from '../availability/usePublicAvailability'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { LoadingState } from '../components/LoadingState'
import { ErrorAlert } from '../components/ErrorAlert'
import { bookingStatusLabel, bookingStatusVariant } from '../lib/bookingStatus'
import { formatDateTimeRange } from '../lib/dateTime'
import { remainingCapacityLabel } from '../lib/capacity'

function isToday(booking) {
  const now = new Date()
  const start = new Date(booking.requested_starts_at)
  const end = new Date(booking.requested_ends_at)
  return start <= now && end >= now
}

function isFuture(booking) {
  return new Date(booking.requested_starts_at).getTime() >= Date.now()
}

export function BusinessDashboardPage() {
  const { businessSlug } = useParams()
  const { data: business } = useBusiness(businessSlug)
  const pending = useBookings(businessSlug, 'pending')
  const accepted = useBookings(businessSlug, 'accepted')
  const recent = useBookings(businessSlug, 'all')
  const { slots, isLoading: isLoadingSlots, isError: isSlotsError } = usePublicAvailability(businessSlug)

  const isLoading = pending.isLoading || accepted.isLoading || recent.isLoading || isLoadingSlots
  const isError = pending.isError || accepted.isError || recent.isError || isSlotsError

  if (isLoading) return <LoadingState label="Loading dashboard…" />
  if (isError) return <ErrorAlert message="Something went wrong loading the dashboard. Please try again." />

  const pendingBookings = pending.data.pages[0] ?? []
  const acceptedBookings = accepted.data.pages[0] ?? []
  const recentBookings = (recent.data.pages[0] ?? []).slice(0, 5)

  const todaysDaycare = acceptedBookings.filter((b) => b.service_offering.service_kind === 'daycare' && isToday(b))
  const boardingOccupancy = acceptedBookings.filter((b) => b.service_offering.service_kind === 'boarding' && isToday(b))
  const upcomingTraining = acceptedBookings
    .filter((b) => b.service_offering.service_kind === 'training' && isFuture(b))
    .sort((a, b) => new Date(a.requested_starts_at) - new Date(b.requested_starts_at))

  const capacityWarnings = slots
    .filter((slot) => slot.remaining_capacity <= Math.max(1, Math.ceil(slot.capacity * 0.25)))
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
    .slice(0, 5)

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={business ? `Operational overview for ${business.name}.` : undefined}
        action={<Button as={Link} to={`/${businessSlug}/bookings`} variant="primary">Review pending requests</Button>}
      />

      <Row className="g-3 mb-3">
        <Col xs={6} md={3}>
          <StatCard label="Pending requests" value={pendingBookings.length} to={`/${businessSlug}/bookings`} />
        </Col>
        <Col xs={6} md={3}>
          <StatCard label="Today's daycare" value={todaysDaycare.length} />
        </Col>
        <Col xs={6} md={3}>
          <StatCard label="Boarding occupancy" value={boardingOccupancy.length} />
        </Col>
        <Col xs={6} md={3}>
          <StatCard label="Upcoming training" value={upcomingTraining.length} />
        </Col>
      </Row>

      {capacityWarnings.length > 0 && (
        <SectionCard title="Capacity warnings">
          <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
            {capacityWarnings.map((slot) => (
              <li key={slot.id} className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div>
                  <p className="mb-0 fw-semibold">{slot.service.name}</p>
                  <p className="mb-0 text-muted small">
                    {formatDateTimeRange(slot.starts_at, slot.ends_at, business?.time_zone)}
                  </p>
                </div>
                <StatusBadge
                  label={remainingCapacityLabel(slot.remaining_capacity, slot.capacity)}
                  variant={slot.remaining_capacity <= 0 ? 'danger' : 'warning'}
                />
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard title="Recent booking activity">
        {recentBookings.length === 0 ? (
          <EmptyState title="No bookings yet" description="Booking requests will show up here once customers start booking." />
        ) : (
          <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
            {recentBookings.map((booking) => (
              <li key={booking.id} className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                <div>
                  <p className="mb-0 fw-semibold">{booking.service_offering.name}</p>
                  <p className="mb-0 text-muted small">
                    {booking.customer.email} — {formatDateTimeRange(booking.requested_starts_at, booking.requested_ends_at, business?.time_zone)}
                  </p>
                </div>
                <StatusBadge label={bookingStatusLabel(booking.status)} variant={bookingStatusVariant(booking.status)} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </>
  )
}
