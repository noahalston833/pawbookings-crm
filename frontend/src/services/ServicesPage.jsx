import { Link, useParams } from 'react-router-dom'
import { useServices } from './useServices'
import { useCurrentMembership } from '../auth/useCurrentMembership'

const SERVICE_KIND_LABELS = {
  daycare: 'Daycare',
  training: 'Training',
  boarding: 'Boarding',
}

export function ServicesPage() {
  const { businessSlug } = useParams()
  const membership = useCurrentMembership()
  const isStaffOrAbove = Boolean(membership && [ 'owner', 'admin', 'staff' ].includes(membership.role))
  const canManage = Boolean(membership && [ 'owner', 'admin' ].includes(membership.role))
  const { data: services, isLoading, isError } = useServices(businessSlug)

  if (isLoading) return <p>Loading services…</p>
  if (isError) return <p role="alert">Something went wrong loading services. Please try again.</p>

  // Staff/admin/owner need to see inactive services too (to reactivate
  // them); customers should only ever be offered something bookable.
  const visibleServices = isStaffOrAbove ? services : services.filter((service) => service.active)

  return (
    <section>
      <h2>Services</h2>
      {canManage && (
        <p><Link to={`/${businessSlug}/services/new`}>New service</Link></p>
      )}
      {visibleServices.length === 0 ? (
        <p>This business doesn&apos;t have any services available right now.</p>
      ) : (
        <ul>
          {visibleServices.map((service) => (
            <li key={service.id}>
              <strong>{service.name}</strong> ({SERVICE_KIND_LABELS[service.service_kind] ?? service.service_kind})
              {!service.active && ' — inactive'}
              {service.description && <p>{service.description}</p>}
              {service.active && (
                <p><Link to={`/${businessSlug}/services/${service.id}/book`}>Request a booking</Link></p>
              )}
              {canManage && (
                <p>
                  <Link to={`/${businessSlug}/services/${service.id}/edit`}>Edit</Link>
                  {' '}
                  <Link to={`/${businessSlug}/services/${service.id}/slots`}>Manage availability</Link>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
