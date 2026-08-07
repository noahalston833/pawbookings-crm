import { Link, useParams } from 'react-router-dom'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Button from 'react-bootstrap/Button'
import { useServices } from './useServices'
import { useCurrentMembership } from '../auth/useCurrentMembership'
import { usePublicAvailability } from '../availability/usePublicAvailability'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { LoadingState } from '../components/LoadingState'
import { ErrorAlert } from '../components/ErrorAlert'
import { serviceKindLabel } from '../lib/serviceKind'
import { availabilityState } from '../lib/availabilityStatus'

// A lightweight "is there anything to book soon" indicator for the
// customer-facing grid -- each service's slots are already ordered by
// starts_at server-side, so the first slot seen for a given service in
// the flattened list is that service's nearest upcoming one.
function nextSlotByServiceId(slots) {
  const result = {}
  for (const slot of slots) {
    if (!(slot.service.id in result)) result[slot.service.id] = slot
  }
  return result
}

export function ServicesPage() {
  const { businessSlug } = useParams()
  const membership = useCurrentMembership()
  const isStaffOrAbove = Boolean(membership && [ 'owner', 'admin', 'staff' ].includes(membership.role))
  const canManage = Boolean(membership && [ 'owner', 'admin' ].includes(membership.role))
  const { data: services, isLoading, isError } = useServices(businessSlug)

  // Staff/admin/owner need to see inactive services too (to reactivate
  // them); customers should only ever be offered something bookable.
  const visibleServices = isLoading ? [] : (isStaffOrAbove ? services : services.filter((service) => service.active))
  const { slots: availabilitySlots } = usePublicAvailability(businessSlug, { enabled: !isStaffOrAbove })
  const nextSlotMap = nextSlotByServiceId(availabilitySlots)

  if (isLoading) return <LoadingState label="Loading services…" />
  if (isError) return <ErrorAlert message="Something went wrong loading services. Please try again." />

  return (
    <>
      <PageHeader
        title={isStaffOrAbove ? 'Services' : 'Find Availability'}
        description={isStaffOrAbove ? 'Manage the services this business offers.' : 'Browse services and request a booking.'}
        action={canManage && (
          <Button as={Link} to={`/${businessSlug}/services/new`} variant="primary">New Service</Button>
        )}
      />

      {visibleServices.length === 0 ? (
        <SectionCard>
          <EmptyState title="No services available" description="This business doesn't have any services available right now." />
        </SectionCard>
      ) : (
        <Row className="g-3">
          {visibleServices.map((service) => {
            const nextSlot = nextSlotMap[service.id]
            const indicator = nextSlot ? availabilityState(nextSlot) : null

            return (
              <Col key={service.id} xs={12} md={6} lg={4}>
                <Card className="section-card h-100 border-0">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <Card.Title as="h2" className="h6 mb-0">{service.name}</Card.Title>
                      {!service.active && <StatusBadge label="Inactive" variant="secondary" />}
                    </div>
                    <p className="text-muted small mb-2">{serviceKindLabel(service.service_kind)}</p>
                    {service.description && <Card.Text className="small">{service.description}</Card.Text>}
                    <p className="small text-muted mb-3">
                      {service.default_duration_minutes
                        ? `${service.default_duration_minutes} minute sessions`
                        : 'Full-day scheduling'}
                    </p>
                    {indicator && (
                      <p className="mb-3"><StatusBadge label={indicator.label} variant={indicator.variant} /></p>
                    )}
                    <div className="mt-auto d-flex flex-wrap gap-2">
                      {service.active && (
                        <Button as={Link} to={`/${businessSlug}/services/${service.id}/book`} variant="primary" size="sm">
                          Request a Booking
                        </Button>
                      )}
                      {canManage && (
                        <>
                          <Button as={Link} to={`/${businessSlug}/services/${service.id}/edit`} variant="outline-secondary" size="sm">
                            Edit
                          </Button>
                          <Button as={Link} to={`/${businessSlug}/services/${service.id}/slots`} variant="outline-secondary" size="sm">
                            Manage availability
                          </Button>
                        </>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}
    </>
  )
}

