import { useId, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

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
    <main>
      <h1>Log in</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor={emailId}>Email</label>
          <input
            id={emailId}
            name="email"
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
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {loginError && (
          <p role="alert">{loginError.message}</p>
        )}
        <button type="submit" disabled={isLoggingIn}>
          {isLoggingIn ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </main>
  )
}
