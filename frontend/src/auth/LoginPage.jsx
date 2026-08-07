import { useId, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { useAuth } from './AuthContext'
import { ErrorAlert } from '../components/ErrorAlert'
import { SectionCard } from '../components/SectionCard'

// Frontend auth state is for usability only; the backend enforces every
// permission regardless of what this page does (see docs/authorization.md).
export function LoginPage() {
  const emailId = useId()
  const passwordId = useId()
  const [ email, setEmail ] = useState('')
  const [ password, setPassword ] = useState('')
  const { login, isLoggingIn, loginError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      await login({ email, password })
      const redirectTo = location.state?.from ?? '/'
      navigate(redirectTo, { replace: true })
    } catch {
      // loginError from useAuth already reflects the failure; nothing
      // further to do here.
    }
  }

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center py-5">
      <Row className="w-100">
        <Col xs={12} sm={{ span: 8, offset: 2 }} md={{ span: 6, offset: 3 }} lg={{ span: 4, offset: 4 }}>
          <p className="app-shell__brand text-center mb-3 fs-5">PawBookings CRM</p>
          <SectionCard>
            <h1 className="h4 mb-3">Log In</h1>
            <Form onSubmit={handleSubmit} noValidate>
              <Form.Group controlId={emailId} className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  name="email"
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
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Form.Group>
              {loginError && <div className="mb-3"><ErrorAlert error={loginError} /></div>}
              <Button type="submit" variant="primary" className="w-100" disabled={isLoggingIn}>
                {isLoggingIn ? 'Logging in…' : 'Log In'}
              </Button>
            </Form>
          </SectionCard>
        </Col>
      </Row>
    </Container>
  )
}

