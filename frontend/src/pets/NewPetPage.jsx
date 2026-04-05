import { useId, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getApiError } from '../api/client'
import { useCreatePet } from './usePets'

const initialForm = {
  name: '',
  breed: '',
  birth_date: '',
  weight: '',
  sex: 'female',
  vaccination_status: 'unknown',
  vaccination_expires_on: '',
  feeding_instructions: '',
  medication_instructions: '',
  behavioral_notes: '',
  emergency_notes: '',
}

export function NewPetPage() {
  const { businessSlug } = useParams()
  const navigate = useNavigate()
  const createPet = useCreatePet(businessSlug)
  const [ form, setForm ] = useState(initialForm)
  const ids = {
    name: useId(),
    breed: useId(),
    birthDate: useId(),
    weight: useId(),
    sex: useId(),
    vaccinationStatus: useId(),
    vaccinationExpiresOn: useId(),
    feeding: useId(),
    medication: useId(),
    behavioral: useId(),
    emergency: useId(),
  }

  function updateField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      await createPet.mutateAsync({ ...form, species: 'dog' })
      navigate(`/${businessSlug}/pets`, { replace: true })
    } catch {
      // Error is surfaced below via createPet.error.
    }
  }

  const error = createPet.error ? getApiError(createPet.error) : null

  return (
    <section>
      <h2>Add a pet</h2>
      <p>Dogs only for this release.</p>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor={ids.name}>Name</label>
          <input id={ids.name} required value={form.name} onChange={updateField('name')} />
        </div>
        <div>
          <label htmlFor={ids.breed}>Breed</label>
          <input id={ids.breed} value={form.breed} onChange={updateField('breed')} />
        </div>
        <div>
          <label htmlFor={ids.birthDate}>Birth date</label>
          <input id={ids.birthDate} type="date" value={form.birth_date} onChange={updateField('birth_date')} />
        </div>
        <div>
          <label htmlFor={ids.weight}>Weight (lbs)</label>
          <input id={ids.weight} type="number" min="0.1" step="0.1" value={form.weight} onChange={updateField('weight')} />
        </div>
        <div>
          <label htmlFor={ids.sex}>Sex</label>
          <select id={ids.sex} value={form.sex} onChange={updateField('sex')}>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>
        <div>
          <label htmlFor={ids.vaccinationStatus}>Vaccination status</label>
          <select id={ids.vaccinationStatus} value={form.vaccination_status} onChange={updateField('vaccination_status')}>
            <option value="unknown">Unknown</option>
            <option value="up_to_date">Up to date</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div>
          <label htmlFor={ids.vaccinationExpiresOn}>Vaccination expiration date</label>
          <input
            id={ids.vaccinationExpiresOn}
            type="date"
            value={form.vaccination_expires_on}
            onChange={updateField('vaccination_expires_on')}
          />
        </div>
        <div>
          <label htmlFor={ids.feeding}>Feeding instructions</label>
          <textarea id={ids.feeding} value={form.feeding_instructions} onChange={updateField('feeding_instructions')} />
        </div>
        <div>
          <label htmlFor={ids.medication}>Medication instructions</label>
          <textarea id={ids.medication} value={form.medication_instructions} onChange={updateField('medication_instructions')} />
        </div>
        <div>
          <label htmlFor={ids.behavioral}>Behavioral notes</label>
          <textarea id={ids.behavioral} value={form.behavioral_notes} onChange={updateField('behavioral_notes')} />
        </div>
        <div>
          <label htmlFor={ids.emergency}>Emergency notes</label>
          <textarea id={ids.emergency} value={form.emergency_notes} onChange={updateField('emergency_notes')} />
        </div>
        {error && <p role="alert">{error.message}</p>}
        <button type="submit" disabled={createPet.isPending}>
          {createPet.isPending ? 'Saving…' : 'Save pet'}
        </button>
      </form>
    </section>
  )
}
