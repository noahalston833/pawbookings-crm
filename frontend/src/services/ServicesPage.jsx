import { Link, useParams } from 'react-router-dom'
import { useServices } from './useServices'

const SERVICE_KIND_LABELS = {
  daycare: 'Daycare',
  training: 'Training',
  boarding: 'Boarding',
}

export function ServicesPage() {
  const { businessSlug } = useParams()
  const { data: services, isLoading, isError } = useServices(businessSlug)

  if (isLoading) return <p>Loading services…</p>
  if (isError) return <p role="alert">Something went wrong loading services. Please try again.</p>

  const activeServices = services.filter((service) => service.active)

  return (
    <section>
      <h2>Services</h2>
      {activeServices.length === 0 ? (
        <p>This business doesn&apos;t have any services available right now.</p>
      ) : (
        <ul>
          {activeServices.map((service) => (
            <li key={service.id}>
              <strong>{service.name}</strong> ({SERVICE_KIND_LABELS[service.service_kind] ?? service.service_kind})
              {service.description && <p>{service.description}</p>}
              <Link to={`/${businessSlug}/services/${service.id}/book`}>Request a booking</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
