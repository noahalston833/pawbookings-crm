import { useEffect, useId, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { getApiError } from '../api/client'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { FormActions } from '../components/FormActions'
import { LoadingState } from '../components/LoadingState'
import { useToast } from '../components/ToastContext'
import { useAuth } from '../auth/AuthContext'
import { useCurrentMembership } from '../auth/useCurrentMembership'
import { useCreatePet, usePet, useUpdatePet } from './usePets'

const BLANK_FORM = {
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

// Used for both creating and editing a pet -- editing pre-fills from the
// fetched record (see the effect below). A viewer who can't edit this
// pet (staff, or another customer's pet) sees a read-only summary
// instead of a disabled form.
export function PetFormPage() {
  const { businessSlug, petId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const membership = useCurrentMembership()
  const { showToast } = useToast()
  const isEditing = Boolean(petId)

  const { data: existingPet, isLoading } = usePet(businessSlug, petId)
  const createPet = useCreatePet(businessSlug)
  const updatePet = useUpdatePet(businessSlug, petId)
  const mutation = isEditing ? updatePet : createPet

  const [ form, setForm ] = useState(BLANK_FORM)
  const ids = {
    name: useId(), breed: useId(), birthDate: useId(), weight: useId(), sex: useId(),
    vaccinationStatus: useId(), vaccinationExpiresOn: useId(),
    feeding: useId(), medication: useId(), behavioral: useId(), emergency: useId(),
  }

  useEffect(() => {
    if (!existingPet) return

    setForm({
      name: existingPet.name,
      breed: existingPet.breed ?? '',
      birth_date: existingPet.birth_date ?? '',
      weight: existingPet.weight ?? '',
      sex: existingPet.sex,
      vaccination_status: existingPet.vaccination_status,
      vaccination_expires_on: existingPet.vaccination_expires_on ?? '',
      feeding_instructions: existingPet.feeding_instructions ?? '',
      medication_instructions: existingPet.medication_instructions ?? '',
      behavioral_notes: existingPet.behavioral_notes ?? '',
      emergency_notes: existingPet.emergency_notes ?? '',
    })
  }, [ existingPet ])

  function updateField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      await mutation.mutateAsync({ ...form, species: 'dog' })
      showToast(isEditing ? 'Pet updated' : 'Pet saved')
      navigate(`/${businessSlug}/pets`, { replace: true })
    } catch {
      // Error is surfaced below via mutation.error.
    }
  }

  if (isEditing && isLoading) return <LoadingState label="Loading pet…" />

  const canEdit = !isEditing || Boolean(
    membership && ([ 'owner', 'admin' ].includes(membership.role) || existingPet?.owner.id === user.id)
  )
  const error = mutation.error ? getApiError(mutation.error) : null

  if (isEditing && !canEdit) {
    return (
      <>
        <PageHeader title={existingPet.name} description="Pet details (read-only)." />
        <SectionCard>
          <Row className="g-3">
            <Col sm={6}><strong>Breed</strong><div>{existingPet.breed || '\u2014'}</div></Col>
            <Col sm={6}><strong>Owner</strong><div>{existingPet.owner.email}</div></Col>
            <Col sm={6}><strong>Sex</strong><div className="text-capitalize">{existingPet.sex}</div></Col>
            <Col sm={6}><strong>Vaccination status</strong><div className="text-capitalize">{existingPet.vaccination_status.replaceAll('_', ' ')}</div></Col>
            <Col xs={12}><strong>Feeding instructions</strong><div>{existingPet.feeding_instructions || '\u2014'}</div></Col>
            <Col xs={12}><strong>Medication instructions</strong><div>{existingPet.medication_instructions || '\u2014'}</div></Col>
            <Col xs={12}><strong>Behavioral notes</strong><div>{existingPet.behavioral_notes || '\u2014'}</div></Col>
          </Row>
        </SectionCard>
      </>
    )
  }

  return (
    <>
      <PageHeader title={isEditing ? `Edit ${existingPet.name}` : 'Add a pet'} description="Dogs only for this release." />
      <SectionCard>
        <Form onSubmit={handleSubmit} noValidate>
          <h2 className="h6">Basic information</h2>
          <Row className="g-3 mb-4">
            <Col md={6}>
              <Form.Group controlId={ids.name}>
                <Form.Label>Name <span className="text-danger" aria-hidden="true">*</span></Form.Label>
                <Form.Control required value={form.name} onChange={updateField('name')} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId={ids.breed}>
                <Form.Label>Breed</Form.Label>
                <Form.Control value={form.breed} onChange={updateField('breed')} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={ids.birthDate}>
                <Form.Label>Birth date</Form.Label>
                <Form.Control type="date" value={form.birth_date} onChange={updateField('birth_date')} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={ids.weight}>
                <Form.Label>Weight (lbs)</Form.Label>
                <Form.Control type="number" min="0.1" step="0.1" value={form.weight} onChange={updateField('weight')} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={ids.sex}>
                <Form.Label>Sex</Form.Label>
                <Form.Select value={form.sex} onChange={updateField('sex')}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <h2 className="h6">Vaccination</h2>
          <Row className="g-3 mb-4">
            <Col md={6}>
              <Form.Group controlId={ids.vaccinationStatus}>
                <Form.Label>Vaccination status</Form.Label>
                <Form.Select value={form.vaccination_status} onChange={updateField('vaccination_status')}>
                  <option value="unknown">Unknown</option>
                  <option value="up_to_date">Up to date</option>
                  <option value="expired">Expired</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId={ids.vaccinationExpiresOn}>
                <Form.Label>Vaccination expiration date</Form.Label>
                <Form.Control
                  type="date"
                  value={form.vaccination_expires_on}
                  onChange={updateField('vaccination_expires_on')}
                />
              </Form.Group>
            </Col>
          </Row>

          <h2 className="h6">Care notes</h2>
          <Row className="g-3">
            <Col xs={12}>
              <Form.Group controlId={ids.feeding}>
                <Form.Label>Feeding instructions</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={form.feeding_instructions}
                  onChange={updateField('feeding_instructions')}
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group controlId={ids.medication}>
                <Form.Label>Medication instructions</Form.Label>
                <Form.Text id={`${ids.medication}-help`} className="d-block mb-1">
                  Include dosage and timing so staff can administer it correctly.
                </Form.Text>
                <Form.Control
                  as="textarea"
                  rows={2}
                  aria-describedby={`${ids.medication}-help`}
                  value={form.medication_instructions}
                  onChange={updateField('medication_instructions')}
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group controlId={ids.behavioral}>
                <Form.Label>Behavioral notes</Form.Label>
                <Form.Text id={`${ids.behavioral}-help`} className="d-block mb-1">
                  Anything staff should know, such as reactivity to other dogs.
                </Form.Text>
                <Form.Control
                  as="textarea"
                  rows={2}
                  aria-describedby={`${ids.behavioral}-help`}
                  value={form.behavioral_notes}
                  onChange={updateField('behavioral_notes')}
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group controlId={ids.emergency}>
                <Form.Label>Emergency notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={form.emergency_notes}
                  onChange={updateField('emergency_notes')}
                />
              </Form.Group>
            </Col>
          </Row>

          {error && <div className="mt-3"><ErrorAlert error={error} /></div>}
          <FormActions
            onCancel={() => navigate(`/${businessSlug}/pets`)}
            isSubmitting={mutation.isPending}
            submitLabel="Save pet"
            submittingLabel="Saving…"
          />
        </Form>
      </SectionCard>
    </>
  )
}
