import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { getApiError } from '../api/client'
import { ErrorAlert } from '../components/ErrorAlert'
import { SectionCard } from '../components/SectionCard'
import { detectTimeZone } from '../lib/timeZone'
import { useBusinessSignup } from './useBusinessSignup'

const TIME_ZONES = typeof Intl.supportedValuesOf === 'function'
  ? Intl.supportedValuesOf('timeZone')
  : [ 'UTC' ]

export function BusinessSignupPage() {
  const nameId = useId()
  const slugId = useId()
  const timeZoneId = useId()
  const emailId = useId()
  const passwordId = useId()

  const [ form, setForm ] = useState({
    business_name: '',
    business_slug: '',
    time_zone: detectTimeZone(),
    owner_email: '',
    owner_password: '',
  })
  const signup = useBusinessSignup()
  const navigate = useNavigate()

  function updateField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      const result = await signup.mutateAsync(form)
      navigate(`/${result.business.slug}`, { replace: true })
    } catch {
      // Error is surfaced below via signup.error.
    }
  }

  const error = signup.error ? getApiError(signup.error) : null

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center py-5">
      <Row className="w-100">
        <Col xs={12} sm={{ span: 10, offset: 1 }} md={{ span: 8, offset: 2 }} lg={{ span: 6, offset: 3 }}>
          <p className="app-shell__brand text-center mb-3 fs-5">PawBookings CRM</p>
          <SectionCard>
            <h1 className="h4 mb-3">Register Your Business</h1>
            <Form onSubmit={handleSubmit} noValidate>
              <Form.Group controlId={nameId} className="mb-3">
                <Form.Label>Business name</Form.Label>
                <Form.Control required value={form.business_name} onChange={updateField('business_name')} />
              </Form.Group>
              <Form.Group controlId={slugId} className="mb-3">
                <Form.Label>Web address (lowercase letters, numbers, hyphens)</Form.Label>
                <Form.Control
                  required
                  pattern="[a-z0-9-]+"
                  value={form.business_slug}
                  onChange={updateField('business_slug')}
                />
              </Form.Group>
              <Form.Group controlId={timeZoneId} className="mb-3">
                <Form.Label>Time zone</Form.Label>
                <Form.Select value={form.time_zone} onChange={updateField('time_zone')}>
                  {TIME_ZONES.map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group controlId={emailId} className="mb-3">
                <Form.Label>Your email</Form.Label>
                <Form.Control
                  type="email"
                  autoComplete="email"
                  required
                  value={form.owner_email}
                  onChange={updateField('owner_email')}
                />
              </Form.Group>
              <Form.Group controlId={passwordId} className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.owner_password}
                  onChange={updateField('owner_password')}
                />
              </Form.Group>
              {error && <div className="mb-3"><ErrorAlert error={error} /></div>}
              <Button type="submit" variant="primary" className="w-100" disabled={signup.isPending}>
                {signup.isPending ? 'Creating your business…' : 'Create Business'}
              </Button>
            </Form>
          </SectionCard>
        </Col>
      </Row>
    </Container>
  )
}

