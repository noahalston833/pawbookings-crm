import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiError } from '../api/client'
import { ApiErrorAlert } from '../components/ApiErrorAlert'
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
    <main>
      <h1>Register your business</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor={nameId}>Business name</label>
          <input id={nameId} required value={form.business_name} onChange={updateField('business_name')} />
        </div>
        <div>
          <label htmlFor={slugId}>Web address (lowercase letters, numbers, hyphens)</label>
          <input id={slugId} required pattern="[a-z0-9-]+" value={form.business_slug} onChange={updateField('business_slug')} />
        </div>
        <div>
          <label htmlFor={timeZoneId}>Time zone</label>
          <select id={timeZoneId} value={form.time_zone} onChange={updateField('time_zone')}>
            {TIME_ZONES.map((zone) => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={emailId}>Your email</label>
          <input id={emailId} type="email" autoComplete="email" required value={form.owner_email} onChange={updateField('owner_email')} />
        </div>
        <div>
          <label htmlFor={passwordId}>Password</label>
          <input
            id={passwordId}
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.owner_password}
            onChange={updateField('owner_password')}
          />
        </div>
        {error && <ApiErrorAlert error={error} />}
        <button type="submit" disabled={signup.isPending}>
          {signup.isPending ? 'Creating your business…' : 'Create business'}
        </button>
      </form>
    </main>
  )
}
