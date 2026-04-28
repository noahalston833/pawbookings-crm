import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useBusiness } from '../businesses/useBusiness'
import { useServiceOffering } from '../services/useServices'
import { useAvailabilitySlots, useCreateAvailabilitySlot, useUpdateAvailabilitySlot } from './useAvailabilitySlots'
import { getApiError } from '../api/client'
import { zonedTimeToUtcIso } from '../lib/timeZone'

const BLANK_SLOT_FORM = { starts_at: '', ends_at: '', capacity: '' }

function formatSlotWindow(slot, timeZone) {
  const formatter = new Intl.DateTimeFormat(undefined, { timeZone, dateStyle: 'medium', timeStyle: 'short' })
  return `${formatter.format(new Date(slot.starts_at))} – ${formatter.format(new Date(slot.ends_at))}`
}

export function ManageAvailabilitySlotsPage() {
  const { businessSlug, serviceOfferingId } = useParams()
  const { data: business } = useBusiness(businessSlug)
  const { data: service } = useServiceOffering(businessSlug, serviceOfferingId)
  const { data: slots, isLoading, isError } = useAvailabilitySlots(businessSlug, serviceOfferingId)
  const createSlot = useCreateAvailabilitySlot(businessSlug, serviceOfferingId)
  const updateSlot = useUpdateAvailabilitySlot(businessSlug, serviceOfferingId)

  // Staff type/read times as the business's own local wall-clock time,
  // not the browser's -- conversion happens at submit (see lib/timeZone.js).
  const timeZone = business?.time_zone ?? 'UTC'
  const [ form, setForm ] = useState(BLANK_SLOT_FORM)
  const [ capacityEdits, setCapacityEdits ] = useState({})

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
      { onSuccess: () => setForm(BLANK_SLOT_FORM) }
    )
  }

  function handleToggleActive(slot) {
    updateSlot.mutate({ slotId: slot.id, attributes: { active: !slot.active } })
  }

  function handleSaveCapacity(slot) {
    const capacity = capacityEdits[slot.id]
    if (capacity === undefined || capacity === '') return

    updateSlot.mutate({ slotId: slot.id, attributes: { capacity } })
  }

  if (isLoading) return <p>Loading availability…</p>
  if (isError) return <p role="alert">Something went wrong loading availability. Please try again.</p>

  const createError = createSlot.error ? getApiError(createSlot.error) : null
  const updateError = updateSlot.error ? getApiError(updateSlot.error) : null

  return (
    <section>
      <h2>Availability for {service?.name ?? 'this service'}</h2>
      <p>Times are shown and entered in the business&apos;s time zone ({timeZone}).</p>

      {updateError && <p role="alert">{updateError.message}</p>}
      {slots.length === 0 ? (
        <p>No slots have been created yet.</p>
      ) : (
        <ul>
          {slots.map((slot) => (
            <li key={slot.id}>
              {formatSlotWindow(slot, timeZone)}
              {' — '}
              {slot.active ? 'active' : 'inactive'}
              <br />
              <label htmlFor={`capacity-${slot.id}`}>Capacity</label>
              {' '}
              <input
                id={`capacity-${slot.id}`}
                type="number"
                min="1"
                value={capacityEdits[slot.id] ?? slot.capacity}
                onChange={(event) => setCapacityEdits((previous) => ({ ...previous, [slot.id]: event.target.value }))}
              />
              {' '}
              <button type="button" onClick={() => handleSaveCapacity(slot)} disabled={updateSlot.isPending}>
                Save capacity
              </button>
              {' '}
              <button type="button" onClick={() => handleToggleActive(slot)} disabled={updateSlot.isPending}>
                {slot.active ? 'Deactivate' : 'Reactivate'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3>Add a slot</h3>
      {createError && <p role="alert">{createError.message}</p>}
      <form onSubmit={handleCreate}>
        <p>
          <label htmlFor="slot-starts-at">Starts at</label>
          <br />
          <input
            id="slot-starts-at"
            name="starts_at"
            type="datetime-local"
            value={form.starts_at}
            onChange={handleFormChange}
            required
          />
        </p>
        <p>
          <label htmlFor="slot-ends-at">Ends at</label>
          <br />
          <input
            id="slot-ends-at"
            name="ends_at"
            type="datetime-local"
            value={form.ends_at}
            onChange={handleFormChange}
            required
          />
        </p>
        <p>
          <label htmlFor="slot-capacity">Capacity</label>
          <br />
          <input
            id="slot-capacity"
            name="capacity"
            type="number"
            min="1"
            placeholder={service ? `e.g. ${service.default_capacity}` : ''}
            value={form.capacity}
            onChange={handleFormChange}
            required
          />
        </p>
        <button type="submit" disabled={createSlot.isPending}>Add slot</button>
      </form>
    </section>
  )
}
