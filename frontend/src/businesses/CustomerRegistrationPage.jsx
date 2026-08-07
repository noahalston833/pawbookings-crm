import { useId, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { useAuth } from '../auth/AuthContext'
import { getApiError } from '../api/client'
import { ErrorAlert } from '../components/ErrorAlert'
import { SectionCard } from '../components/SectionCard'
import { useBusiness } from './useBusiness'
import { useCustomerRegistration } from './useCustomerRegistration'

export function CustomerRegistrationPage() {
  const { businessSlug } = useParams()
  const emailId = useId()
  const passwordId = useId()
  const { user } = useAuth()
  const { data: business } = useBusiness(businessSlug)
  const [ email, setEmail ] = useState('')
  const [ password, setPassword ] = useState('')
  const register = useCustomerRegistration(businessSlug)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      await register.mutateAsync({ email: user?.email ?? email, password })
      navigate(`/${businessSlug}`, { replace: true })
    } catch {
      // Error is surfaced below via register.error.
    }
  }

  const error = register.error ? getApiError(register.error) : null
  const businessName = business?.name ?? businessSlug

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center py-5">
      <Row className="w-100">
        <Col xs={12} sm={{ span: 8, offset: 2 }} md={{ span: 6, offset: 3 }} lg={{ span: 4, offset: 4 }}>
          <p className="app-shell__brand text-center mb-3 fs-5">PawBookings CRM</p>
          <SectionCard>
            <h1 className="h4 mb-3">Sign up for {businessName}</h1>

            {user ? (
              <Form onSubmit={handleSubmit} noValidate>
                <p>Join as {user.email}?</p>
                <Button type="submit" variant="primary" className="w-100" disabled={register.isPending}>
                  {register.isPending ? 'Joining…' : 'Join'}
                </Button>
              </Form>
            ) : (
              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group controlId={emailId} className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </Form.Group>
                <Form.Group controlId={passwordId} className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100" disabled={register.isPending}>
                  {register.isPending ? 'Signing up…' : 'Sign up'}
                </Button>
              </Form>
            )}

            {error && (
              <div className="mt-3">
                <ErrorAlert error={error}>
                  {error.code === 'email_already_registered' && (
                    <>
                      {' '}
                      <Link to="/login" state={{ from: `/${businessSlug}/signup` }}>Log in instead</Link>
                    </>
                  )}
                </ErrorAlert>
              </div>
            )}
          </SectionCard>
        </Col>
      </Row>
    </Container>
  )
}

