import { useEffect, useId, useState } from 'react'
import { useParams } from 'react-router-dom'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import { getApiError } from '../api/client'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { LoadingState } from '../components/LoadingState'
import { useToast } from '../components/ToastContext'
import { detectTimeZone } from '../lib/timeZone'
import { useBusinessSettings, useUpdateBusinessSettings } from './useBusinessSettings'

const TIME_ZONES = typeof Intl.supportedValuesOf === 'function'
  ? Intl.supportedValuesOf('timeZone')
  : [ 'UTC' ]

export function BusinessSettingsPage() {
  const { businessSlug } = useParams()
  const nameId = useId()
  const timeZoneId = useId()
  const { showToast } = useToast()

  const { data: business, isLoading, isError } = useBusinessSettings(businessSlug)
  const updateSettings = useUpdateBusinessSettings(businessSlug)

  const [ form, setForm ] = useState({ name: '', time_zone: detectTimeZone() })

  useEffect(() => {
    if (business) setForm({ name: business.name, time_zone: business.time_zone })
  }, [ business ])

  function updateField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    updateSettings.mutate(form, { onSuccess: () => showToast('Settings saved') })
  }

  if (isLoading) return <LoadingState label="Loading settings…" />
  if (isError) return <ErrorAlert message="Something went wrong loading settings. Please try again." />

  const error = updateSettings.error ? getApiError(updateSettings.error) : null

  return (
    <>
      <PageHeader title="Business Settings" />
      <SectionCard>
        <Form onSubmit={handleSubmit} noValidate>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group controlId={nameId}>
                <Form.Label>Business name</Form.Label>
                <Form.Control required value={form.name} onChange={updateField('name')} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId={timeZoneId}>
                <Form.Label>Time zone</Form.Label>
                <Form.Select value={form.time_zone} onChange={updateField('time_zone')}>
                  {TIME_ZONES.map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          {error && <div className="mt-3"><ErrorAlert error={error} /></div>}
          <div className="d-flex justify-content-end mt-4">
            <Button type="submit" variant="primary" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? 'Saving…' : 'Save settings'}
            </Button>
          </div>
        </Form>
      </SectionCard>
    </>
  )
}

