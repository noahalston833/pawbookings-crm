import { Link, useParams } from 'react-router-dom'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import { useAuth } from '../auth/AuthContext'
import { useBusiness } from '../businesses/useBusiness'
import { usePets } from '../pets/usePets'
import { useBookings } from '../bookings/useBookings'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { LoadingState } from '../components/LoadingState'
import { ErrorAlert } from '../components/ErrorAlert'
import { bookingStatusLabel, bookingStatusVariant } from '../lib/bookingStatus'
import { formatDateTimeRange } from '../lib/dateTime'

function soonestUpcoming(bookings) {
  const now = Date.now()
  return bookings
    .filter((booking) => new Date(booking.requested_starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.requested_starts_at) - new Date(b.requested_starts_at))[0]
}

export function CustomerDashboardPage() {
  const { businessSlug } = useParams()
  const { user } = useAuth()
  const { data: business } = useBusiness(businessSlug)
  const { data: pets, isLoading: isLoadingPets } = usePets(businessSlug)
  const accepted = useBookings(businessSlug, 'accepted')
  const pending = useBookings(businessSlug, 'pending')
  const recent = useBookings(businessSlug, 'all')

  const isLoading = isLoadingPets || accepted.isLoading || pending.isLoading || recent.isLoading
  const isError = accepted.isError || pending.isError || recent.isError

  if (isLoading) return <LoadingState label="Loading your dashboard…" />
  if (isError) return <ErrorAlert message="Something went wrong loading your dashboard. Please try again." />

  const acceptedBookings = accepted.data.pages[0] ?? []
  const pendingBookings = pending.data.pages[0] ?? []
  const recentBookings = (recent.data.pages[0] ?? []).slice(0, 5)
  const upcoming = soonestUpcoming(acceptedBookings)
  const firstName = user.email.split('@')[0]

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={business ? `Here's what's happening at ${business.name}.` : undefined}
        action={<Button as={Link} to={`/${businessSlug}/services`} variant="primary">Request a Booking</Button>}
      />

      <Row className="g-3 mb-3">
        <Col xs={12} sm={4}>
          <StatCard label="Pending requests" value={pendingBookings.length} to={`/${businessSlug}/bookings`} />
        </Col>
        <Col xs={12} sm={4}>
          <StatCard label="Your pets" value={pets.length} to={`/${businessSlug}/pets`} />
        </Col>
        <Col xs={12} sm={4}>
          <StatCard
            label="Upcoming booking"
            value={upcoming ? formatDateTimeRange(upcoming.requested_starts_at, upcoming.requested_ends_at, business?.time_zone) : 'None scheduled'}
          />
        </Col>
      </Row>

      {upcoming && (
        <SectionCard title="Your next accepted booking">
          <p className="mb-1 fw-semibold">{upcoming.service_offering.name}</p>
          <p className="mb-1">{formatDateTimeRange(upcoming.requested_starts_at, upcoming.requested_ends_at, business?.time_zone)}</p>
          <p className="mb-0 text-muted">Pets: {upcoming.pets.map((pet) => pet.name).join(', ')}</p>
        </SectionCard>
      )}

      <SectionCard title="Recent booking activity">
        {recentBookings.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            description="Request your first booking to see activity here."
            action={<Button as={Link} to={`/${businessSlug}/services`} variant="primary">Find Availability</Button>}
          />
        ) : (
          <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
            {recentBookings.map((booking) => (
              <li key={booking.id} className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                <div>
                  <p className="mb-0 fw-semibold">{booking.service_offering.name}</p>
                  <p className="mb-0 text-muted small">
                    {formatDateTimeRange(booking.requested_starts_at, booking.requested_ends_at, business?.time_zone)}
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
