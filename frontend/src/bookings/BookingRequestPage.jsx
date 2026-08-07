import { useId, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { getApiError } from '../api/client'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { LoadingState } from '../components/LoadingState'
import { useToast } from '../components/ToastContext'
import { useServiceOffering } from '../services/useServices'
import { useAvailability } from '../availability/useAvailability'
import { AvailabilityList } from '../availability/AvailabilityList'
import { usePets } from '../pets/usePets'
import { useCreateBooking } from './useBookings'
import { formatDateTimeRange } from '../lib/dateTime'

export function BookingRequestPage() {
  const { businessSlug, serviceOfferingId } = useParams()
  const navigate = useNavigate()
  const notesId = useId()
  const { showToast } = useToast()

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

  const selectedSlots = useMemo(
    () => (availability?.slots ?? []).filter((slot) => selectedSlotIds.includes(slot.id)),
    [ availability, selectedSlotIds ]
  )
  const selectedPets = useMemo(
    () => activePets.filter((pet) => selectedPetIds.includes(pet.id)),
    [ activePets, selectedPetIds ]
  )
  const requestedRange = useMemo(() => {
    if (selectedSlots.length === 0) return null
    return {
      startsAt: selectedSlots.reduce((earliest, slot) => (slot.starts_at < earliest ? slot.starts_at : earliest), selectedSlots[0].starts_at),
      endsAt: selectedSlots.reduce((latest, slot) => (slot.ends_at > latest ? slot.ends_at : latest), selectedSlots[0].ends_at),
    }
  }, [ selectedSlots ])

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

    try {
      await createBooking.mutateAsync({
        attributes: {
          service_offering_id: Number(serviceOfferingId),
          pet_ids: selectedPetIds,
          requested_starts_at: requestedRange.startsAt,
          requested_ends_at: requestedRange.endsAt,
          notes,
        },
        idempotencyKey: idempotencyKeyRef.current,
      })
      showToast('Booking request submitted')
      navigate(`/${businessSlug}/bookings`, { replace: true })
    } catch {
      // Error is surfaced below via createBooking.error.
    }
  }

  if (isAvailabilityLoading || isPetsLoading) return <LoadingState label="Loading…" />

  const error = createBooking.error ? getApiError(createBooking.error) : null
  const canSubmit = selectedSlotIds.length > 0 && selectedPetIds.length > 0 && !createBooking.isPending

  return (
    <>
      <PageHeader
        title={`Request a Booking${service ? `: ${service.name}` : ''}`}
        description={service?.customer_facing_instructions || undefined}
      />

      {activePets.length === 0 ? (
        <SectionCard>
          <p className="mb-0">You need to add a pet before requesting a booking.</p>
        </SectionCard>
      ) : (
        <Form onSubmit={handleSubmit} noValidate>
          <SectionCard title="1. Choose a date/time" className="mb-4">
            <AvailabilityList
              slots={availability.slots}
              timeZone={availability.time_zone}
              selectedIds={selectedSlotIds}
              onToggle={toggleSlot}
            />
          </SectionCard>

          <SectionCard title="2. Which pet(s)?" className="mb-4">
            <div className="d-flex flex-column gap-2">
              {activePets.map((pet) => (
                <Form.Check
                  key={pet.id}
                  type="checkbox"
                  id={`booking-pet-${pet.id}`}
                  label={pet.name}
                  checked={selectedPetIds.includes(pet.id)}
                  onChange={() => togglePet(pet.id)}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="3. Notes (optional)" className="mb-4">
            <Form.Control
              as="textarea"
              id={notesId}
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything the business should know about this request"
            />
          </SectionCard>

          <SectionCard title="Review your request" className="mb-4">
            {requestedRange && selectedPets.length > 0 ? (
              <dl className="row mb-0">
                <dt className="col-sm-3">Service</dt>
                <dd className="col-sm-9">{service?.name}</dd>
                <dt className="col-sm-3">Date/time</dt>
                <dd className="col-sm-9">{formatDateTimeRange(requestedRange.startsAt, requestedRange.endsAt, availability.time_zone)}</dd>
                <dt className="col-sm-3">Pet(s)</dt>
                <dd className="col-sm-9">{selectedPets.map((pet) => pet.name).join(', ')}</dd>
                {notes && (
                  <>
                    <dt className="col-sm-3">Notes</dt>
                    <dd className="col-sm-9">{notes}</dd>
                  </>
                )}
              </dl>
            ) : (
              <p className="text-muted mb-0">Select a date/time and at least one pet to see a summary here.</p>
            )}
          </SectionCard>

          {error && <div className="mb-3"><ErrorAlert error={error} /></div>}

          <div className="d-flex justify-content-end">
            <Button type="submit" variant="primary" disabled={!canSubmit}>
              {createBooking.isPending ? 'Submitting…' : 'Request Booking'}
            </Button>
          </div>
        </Form>
      )}
    </>
  )
}

