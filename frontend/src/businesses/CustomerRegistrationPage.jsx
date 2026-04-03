import { useId, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getApiError } from '../api/client'
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
    <main>
      <h1>Sign up for {businessName}</h1>

      {user ? (
        <form onSubmit={handleSubmit} noValidate>
          <p>Join as {user.email}?</p>
          <button type="submit" disabled={register.isPending}>
            {register.isPending ? 'Joining…' : 'Join'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor={emailId}>Email</label>
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor={passwordId}>Password</label>
            <input
              id={passwordId}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <button type="submit" disabled={register.isPending}>
            {register.isPending ? 'Signing up…' : 'Sign up'}
          </button>
        </form>
      )}

      {error && (
        <p role="alert">
          {error.message}
          {error.code === 'email_already_registered' && (
            <>
              {' '}
              <Link to="/login" state={{ from: `/${businessSlug}/signup` }}>Log in instead</Link>
            </>
          )}
        </p>
      )}
    </main>
  )
}
