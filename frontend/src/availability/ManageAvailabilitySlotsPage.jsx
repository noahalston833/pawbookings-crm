import { useId, useState } from 'react'
import { useParams } from 'react-router-dom'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import { useBusiness } from '../businesses/useBusiness'
import { useServiceOffering } from '../services/useServices'
import { useAvailabilitySlots, useCreateAvailabilitySlot, useUpdateAvailabilitySlot } from './useAvailabilitySlots'
import { getApiError } from '../api/client'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { ResponsiveTable } from '../components/ResponsiveTable'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { LoadingState } from '../components/LoadingState'
import { useToast } from '../components/ToastContext'
import { zonedTimeToUtcIso } from '../lib/timeZone'
import { formatDateTimeRange } from '../lib/dateTime'

const BLANK_SLOT_FORM = { starts_at: '', ends_at: '', capacity: '' }

export function ManageAvailabilitySlotsPage() {
  const { businessSlug, serviceOfferingId } = useParams()
  const { data: business } = useBusiness(businessSlug)
  const { data: service } = useServiceOffering(businessSlug, serviceOfferingId)
  const { data: slots, isLoading, isError } = useAvailabilitySlots(businessSlug, serviceOfferingId)
  const createSlot = useCreateAvailabilitySlot(businessSlug, serviceOfferingId)
  const updateSlot = useUpdateAvailabilitySlot(businessSlug, serviceOfferingId)
  const { showToast } = useToast()

  // Staff type/read times as the business's own local wall-clock time,
  // not the browser's -- conversion happens at submit (see lib/timeZone.js).
  const timeZone = business?.time_zone ?? 'UTC'
  const [ form, setForm ] = useState(BLANK_SLOT_FORM)
  const [ capacityEdits, setCapacityEdits ] = useState({})
  const startsAtId = useId()
  const endsAtId = useId()
  const capacityId = useId()

  function handleFormChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  function handleCreate(event) {
    event.preventDefault()

    createSlot.mutate(
      {
        starts_at: zonedTimeToUtcIso(form.starts_at, timeZone),
        ends_at: zonedTimeToUtcIso(form.ends_at, timeZone),
        capacity: form.capacity,
      },
      {
        onSuccess: () => {
          showToast('Availability added')
          setForm(BLANK_SLOT_FORM)
        },
      }
    )
  }

  function handleToggleActive(slot) {
    updateSlot.mutate(
      { slotId: slot.id, attributes: { active: !slot.active } },
      { onSuccess: () => showToast('Availability updated') }
    )
  }

  function handleSaveCapacity(slot) {
    const capacity = capacityEdits[slot.id]
    if (capacity === undefined || capacity === '') return

    updateSlot.mutate(
      { slotId: slot.id, attributes: { capacity } },
      { onSuccess: () => showToast('Availability updated') }
    )
  }

  if (isLoading) return <LoadingState label="Loading availability…" />
  if (isError) return <ErrorAlert message="Something went wrong loading availability. Please try again." />

  const createError = createSlot.error ? getApiError(createSlot.error) : null
  const updateError = updateSlot.error ? getApiError(updateSlot.error) : null

  return (
    <>
      <PageHeader
        title={`Availability for ${service?.name ?? 'this service'}`}
        description={`Times are shown and entered in the business's time zone (${timeZone}).`}
      />

      <SectionCard title="Slots" className="mb-4">
        {updateError && <div className="mb-3"><ErrorAlert error={updateError} /></div>}
        {slots.length === 0 ? (
          <EmptyState title="No slots yet" description="Add the first slot below." />
        ) : (
          <ResponsiveTable>
            <thead>
              <tr>
                <th scope="col">Date / time range</th>
                <th scope="col">Status</th>
                <th scope="col">Capacity</th>
                <th scope="col" className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot.id}>
                  <td>{formatDateTimeRange(slot.starts_at, slot.ends_at, timeZone)}</td>
                  <td><StatusBadge label={slot.active ? 'Active' : 'Inactive'} variant={slot.active ? 'success' : 'secondary'} /></td>
                  <td style={{ maxWidth: '8rem' }}>
                    <Form.Label htmlFor={`capacity-${slot.id}`} visuallyHidden>Capacity</Form.Label>
                    <Form.Control
                      id={`capacity-${slot.id}`}
                      type="number"
                      min="1"
                      size="sm"
                      value={capacityEdits[slot.id] ?? slot.capacity}
                      onChange={(event) => setCapacityEdits((previous) => ({ ...previous, [slot.id]: event.target.value }))}
                    />
                  </td>
                  <td className="text-end">
                    <div className="d-flex gap-2 justify-content-end">
                      <Button size="sm" variant="outline-secondary" onClick={() => handleSaveCapacity(slot)} disabled={updateSlot.isPending}>
                        Save capacity
                      </Button>
                      <Button size="sm" variant="outline-secondary" onClick={() => handleToggleActive(slot)} disabled={updateSlot.isPending}>
                        {slot.active ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        )}
      </SectionCard>

      <SectionCard title="Add a slot">
        {createError && <div className="mb-3"><ErrorAlert error={createError} /></div>}
        <Form onSubmit={handleCreate}>
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Group controlId={startsAtId}>
                <Form.Label>Starts at</Form.Label>
                <Form.Control
                  name="starts_at"
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={handleFormChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={endsAtId}>
                <Form.Label>Ends at</Form.Label>
                <Form.Control
                  name="ends_at"
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={handleFormChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group controlId={capacityId}>
                <Form.Label>Capacity</Form.Label>
                <Form.Control
                  name="capacity"
                  type="number"
                  min="1"
                  placeholder={service ? `e.g. ${service.default_capacity}` : ''}
                  value={form.capacity}
                  onChange={handleFormChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Button type="submit" variant="primary" disabled={createSlot.isPending} className="w-100">
                {createSlot.isPending ? 'Adding…' : 'Add slot'}
              </Button>
            </Col>
          </Row>
        </Form>
      </SectionCard>
    </>
  )
}

