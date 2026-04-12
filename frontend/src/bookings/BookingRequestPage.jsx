import { useId, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getApiError } from '../api/client'
import { useServiceOffering } from '../services/useServices'
import { useAvailability } from '../availability/useAvailability'
import { AvailabilityList } from '../availability/AvailabilityList'
import { usePets } from '../pets/usePets'
import { useCreateBooking } from './useBookings'

export function BookingRequestPage() {
  const { businessSlug, serviceOfferingId } = useParams()
  const navigate = useNavigate()
  const notesId = useId()

  const { data: service } = useServiceOffering(businessSlug, serviceOfferingId)
  const { data: availability, isLoading: isAvailabilityLoading } = useAvailability(businessSlug, serviceOfferingId)
  const { data: pets, isLoading: isPetsLoading } = usePets(businessSlug)
  const createBooking = useCreateBooking(businessSlug)

  const [ selectedSlotIds, setSelectedSlotIds ] = useState([])
  const [ selectedPetIds, setSelectedPetIds ] = useState([])
  const [ notes, setNotes ] = useState('')
  // Stable for the lifetime of this attempt: retried submits of the same
  // request replay the original response instead of double-booking.
  const idempotencyKeyRef = useRef(crypto.randomUUID())

  const activePets = useMemo(() => (pets ?? []).filter((pet) => pet.status === 'active'), [ pets ])

  function toggleSlot(slotId) {
    setSelectedSlotIds((current) =>
      current.includes(slotId) ? current.filter((id) => id !== slotId) : [ ...current, slotId ]
    )
  }

  function togglePet(petId) {
    setSelectedPetIds((current) =>
      current.includes(petId) ? current.filter((id) => id !== petId) : [ ...current, petId ]
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const selectedSlots = availability.slots.filter((slot) => selectedSlotIds.includes(slot.id))
    const requestedStartsAt = selectedSlots.reduce(
      (earliest, slot) => (slot.starts_at < earliest ? slot.starts_at : earliest),
      selectedSlots[0].starts_at
    )
    const requestedEndsAt = selectedSlots.reduce(
      (latest, slot) => (slot.ends_at > latest ? slot.ends_at : latest),
      selectedSlots[0].ends_at
    )

    try {
      await createBooking.mutateAsync({
        attributes: {
          service_offering_id: Number(serviceOfferingId),
          pet_ids: selectedPetIds,
          requested_starts_at: requestedStartsAt,
          requested_ends_at: requestedEndsAt,
          notes,
        },
        idempotencyKey: idempotencyKeyRef.current,
      })
      navigate(`/${businessSlug}/bookings`, { replace: true })
    } catch {
      // Error is surfaced below via createBooking.error.
    }
  }

  if (isAvailabilityLoading || isPetsLoading) return <p>Loading…</p>

  const error = createBooking.error ? getApiError(createBooking.error) : null
  const canSubmit = selectedSlotIds.length > 0 && selectedPetIds.length > 0 && !createBooking.isPending

  return (
    <section>
      <h2>Request booking{service ? `: ${service.name}` : ''}</h2>
      {service?.customer_facing_instructions && <p>{service.customer_facing_instructions}</p>}

      {activePets.length === 0 ? (
        <p>
          You need to add a pet before requesting a booking.
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <AvailabilityList
            slots={availability.slots}
            timeZone={availability.time_zone}
            selectedIds={selectedSlotIds}
            onToggle={toggleSlot}
          />

          <fieldset>
            <legend>Which pet(s)?</legend>
            <ul>
              {activePets.map((pet) => (
                <li key={pet.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedPetIds.includes(pet.id)}
                      onChange={() => togglePet(pet.id)}
                    />
                    {' '}
                    {pet.name}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          <div>
            <label htmlFor={notesId}>Notes (optional)</label>
            <textarea id={notesId} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>

          {error && <p role="alert">{error.message}</p>}

          <button type="submit" disabled={!canSubmit}>
            {createBooking.isPending ? 'Submitting…' : 'Request booking'}
          </button>
        </form>
      )}
    </section>
  )
}
