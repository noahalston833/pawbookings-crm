import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCreateService, useServiceOffering, useUpdateService } from './useServices'
import { getApiError } from '../api/client'
import { ApiErrorAlert } from '../components/ApiErrorAlert'

const SERVICE_KINDS = [ 'daycare', 'training', 'boarding' ]

const BLANK_FORM = {
  name: '',
  service_kind: 'daycare',
  description: '',
  default_capacity: '',
  default_duration_minutes: '',
  customer_facing_instructions: '',
  active: true,
}

// Used for both creating and editing a service -- editing pre-fills from
// the fetched record once it loads (see the effect below).
export function ServiceFormPage() {
  const { businessSlug, serviceOfferingId } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(serviceOfferingId)

  const { data: existingService, isLoading } = useServiceOffering(businessSlug, serviceOfferingId)
  const createService = useCreateService(businessSlug)
  const updateService = useUpdateService(businessSlug, serviceOfferingId)
  const mutation = isEditing ? updateService : createService

  const [ form, setForm ] = useState(BLANK_FORM)

  useEffect(() => {
    if (!existingService) return

    setForm({
      name: existingService.name,
      service_kind: existingService.service_kind,
      description: existingService.description ?? '',
      default_capacity: String(existingService.default_capacity),
      default_duration_minutes:
        existingService.default_duration_minutes == null ? '' : String(existingService.default_duration_minutes),
      customer_facing_instructions: existingService.customer_facing_instructions ?? '',
      active: existingService.active,
    })
  }, [ existingService ])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const attributes = {
      ...form,
      default_duration_minutes: form.default_duration_minutes === '' ? null : form.default_duration_minutes,
    }

    mutation.mutate(attributes, {
      onSuccess: () => navigate(`/${businessSlug}/services`),
    })
  }

  if (isEditing && isLoading) return <p>Loading service…</p>

  const error = mutation.error ? getApiError(mutation.error) : null

  return (
    <section>
      <h2>{isEditing ? 'Edit service' : 'New service'}</h2>
      {error && <ApiErrorAlert error={error} />}
      <form onSubmit={handleSubmit}>
        <p>
          <label htmlFor="service-name">Name</label>
          <br />
          <input id="service-name" name="name" value={form.name} onChange={handleChange} required />
        </p>
        <p>
          <label htmlFor="service-kind">Kind</label>
          <br />
          <select id="service-kind" name="service_kind" value={form.service_kind} onChange={handleChange}>
            {SERVICE_KINDS.map((kind) => (
              <option key={kind} value={kind}>{kind}</option>
            ))}
          </select>
        </p>
        <p>
          <label htmlFor="service-description">Description</label>
          <br />
          <textarea id="service-description" name="description" value={form.description} onChange={handleChange} />
        </p>
        <p>
          <label htmlFor="service-default-capacity">Default capacity</label>
          <br />
          <input
            id="service-default-capacity"
            name="default_capacity"
            type="number"
            min="1"
            value={form.default_capacity}
            onChange={handleChange}
            required
          />
        </p>
        <p>
          <label htmlFor="service-default-duration">Default duration (minutes)</label>
          <br />
          <input
            id="service-default-duration"
            name="default_duration_minutes"
            type="number"
            min="1"
            value={form.default_duration_minutes}
            onChange={handleChange}
          />
        </p>
        <p>
          <label htmlFor="service-instructions">Customer-facing instructions</label>
          <br />
          <textarea
            id="service-instructions"
            name="customer_facing_instructions"
            value={form.customer_facing_instructions}
            onChange={handleChange}
          />
        </p>
        {isEditing && (
          <p>
            <label>
              <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
              {' '}Active
            </label>
          </p>
        )}
        <button type="submit" disabled={mutation.isPending}>
          {isEditing ? 'Save changes' : 'Create service'}
        </button>
      </form>
    </section>
  )
}
