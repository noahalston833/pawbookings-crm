import { useEffect, useId, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { useCreateService, useServiceOffering, useUpdateService } from './useServices'
import { getApiError } from '../api/client'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { FormActions } from '../components/FormActions'
import { LoadingState } from '../components/LoadingState'
import { useToast } from '../components/ToastContext'
import { SERVICE_KINDS, serviceKindLabel } from '../lib/serviceKind'

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
  const { showToast } = useToast()
  const isEditing = Boolean(serviceOfferingId)

  const { data: existingService, isLoading } = useServiceOffering(businessSlug, serviceOfferingId)
  const createService = useCreateService(businessSlug)
  const updateService = useUpdateService(businessSlug, serviceOfferingId)
  const mutation = isEditing ? updateService : createService

  const [ form, setForm ] = useState(BLANK_FORM)
  const ids = {
    name: useId(), kind: useId(), description: useId(),
    capacity: useId(), duration: useId(), instructions: useId(), active: useId(),
  }

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
      onSuccess: () => {
        showToast(isEditing ? 'Service updated' : 'Service created')
        navigate(`/${businessSlug}/services`)
      },
    })
  }

  if (isEditing && isLoading) return <LoadingState label="Loading service…" />

  const error = mutation.error ? getApiError(mutation.error) : null

  return (
    <>
      <PageHeader title={isEditing ? `Edit ${existingService.name}` : 'New Service'} />
      <SectionCard>
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={8}>
              <Form.Group controlId={ids.name}>
                <Form.Label>Name <span className="text-danger" aria-hidden="true">*</span></Form.Label>
                <Form.Control name="name" value={form.name} onChange={handleChange} required />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={ids.kind}>
                <Form.Label>Kind</Form.Label>
                <Form.Select name="service_kind" value={form.service_kind} onChange={handleChange}>
                  {SERVICE_KINDS.map((kind) => (
                    <option key={kind} value={kind}>{serviceKindLabel(kind)}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group controlId={ids.description}>
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId={ids.capacity}>
                <Form.Label>Default capacity <span className="text-danger" aria-hidden="true">*</span></Form.Label>
                <Form.Control
                  name="default_capacity"
                  type="number"
                  min="1"
                  value={form.default_capacity}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId={ids.duration}>
                <Form.Label>Default duration (minutes)</Form.Label>
                <Form.Text id={`${ids.duration}-help`} className="d-block mb-1">
                  Leave blank for full-day services like boarding.
                </Form.Text>
                <Form.Control
                  name="default_duration_minutes"
                  type="number"
                  min="1"
                  aria-describedby={`${ids.duration}-help`}
                  value={form.default_duration_minutes}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group controlId={ids.instructions}>
                <Form.Label>Customer-facing instructions</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="customer_facing_instructions"
                  value={form.customer_facing_instructions}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            {isEditing && (
              <Col xs={12}>
                <Form.Check
                  type="checkbox"
                  id={ids.active}
                  name="active"
                  label="Active"
                  checked={form.active}
                  onChange={handleChange}
                />
              </Col>
            )}
          </Row>

          {error && <div className="mt-3"><ErrorAlert error={error} /></div>}
          <FormActions
            onCancel={() => navigate(`/${businessSlug}/services`)}
            isSubmitting={mutation.isPending}
            submitLabel={isEditing ? 'Save changes' : 'Create service'}
            submittingLabel="Saving…"
          />
        </Form>
      </SectionCard>
    </>
  )
}

