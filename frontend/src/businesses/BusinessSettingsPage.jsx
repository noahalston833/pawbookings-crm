import { useEffect, useId, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getApiError } from '../api/client'
import { ApiErrorAlert } from '../components/ApiErrorAlert'
import { useBusinessSettings, useUpdateBusinessSettings } from './useBusinessSettings'

const TIME_ZONES = typeof Intl.supportedValuesOf === 'function'
  ? Intl.supportedValuesOf('timeZone')
  : [ 'UTC' ]

export function BusinessSettingsPage() {
  const { businessSlug } = useParams()
  const nameId = useId()
  const timeZoneId = useId()

  const { data: business, isLoading, isError } = useBusinessSettings(businessSlug)
  const updateSettings = useUpdateBusinessSettings(businessSlug)

  const [ form, setForm ] = useState({ name: '', time_zone: 'UTC' })
  const [ saved, setSaved ] = useState(false)

  useEffect(() => {
    if (business) setForm({ name: business.name, time_zone: business.time_zone })
  }, [ business ])

  function updateField(field) {
    return (event) => {
      setSaved(false)
      setForm((current) => ({ ...current, [field]: event.target.value }))
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    updateSettings.mutate(form, { onSuccess: () => setSaved(true) })
  }

  if (isLoading) return <p>Loading settings…</p>
  if (isError) return <p role="alert">Something went wrong loading settings. Please try again.</p>

  const error = updateSettings.error ? getApiError(updateSettings.error) : null

  return (
    <section>
      <h2>Business settings</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor={nameId}>Business name</label>
          <br />
          <input id={nameId} required value={form.name} onChange={updateField('name')} />
        </div>
        <div>
          <label htmlFor={timeZoneId}>Time zone</label>
          <br />
          <select id={timeZoneId} value={form.time_zone} onChange={updateField('time_zone')}>
            {TIME_ZONES.map((zone) => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </div>
        {error && <ApiErrorAlert error={error} />}
        {saved && !error && <p>Saved.</p>}
        <button type="submit" disabled={updateSettings.isPending}>Save settings</button>
      </form>
    </section>
  )
}
