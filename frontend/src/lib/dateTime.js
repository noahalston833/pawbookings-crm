// One place for every date/time display in the app, so a business's
// schedule always renders in ITS time zone (see docs/tenancy.md) rather
// than whatever the visitor's browser happens to be set to.
export function formatDate(value, timeZone) {
  return new Intl.DateTimeFormat(undefined, { timeZone, dateStyle: 'medium' }).format(new Date(value))
}

export function formatDateTime(value, timeZone) {
  return new Intl.DateTimeFormat(undefined, { timeZone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function formatDateTimeRange(startsAt, endsAt, timeZone) {
  const formatter = new Intl.DateTimeFormat(undefined, { timeZone, dateStyle: 'medium', timeStyle: 'short' })
  return `${formatter.format(new Date(startsAt))} \u2013 ${formatter.format(new Date(endsAt))}`
}

// Relative "how long has this been waiting" for the pending queue --
// coarse on purpose (a queue doesn't need second-level precision).
export function formatRelativeAge(value) {
  const ms = Date.now() - new Date(value).getTime()
  const minutes = Math.round(ms / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

// A pet's birth_date is a plain date (no time zone conversion needed).
export function formatAge(birthDate) {
  if (!birthDate) return null

  const birth = new Date(`${birthDate}T00:00:00`)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (now.getDate() < birth.getDate()) months -= 1
  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years <= 0) return `${months} mo`
  if (months === 0) return `${years} yr`
  return `${years} yr ${months} mo`
}

const VACCINATION_WARNING_WINDOW_DAYS = 30

// Only meaningful for a dog marked up-to-date -- an expiring/expired
// "unknown" status isn't a warning, it's just missing information.
export function vaccinationExpiryWarning(pet) {
  if (pet.vaccination_status !== 'up_to_date' || !pet.vaccination_expires_on) return null

  const daysRemaining = Math.ceil(
    (new Date(`${pet.vaccination_expires_on}T00:00:00`).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  )

  if (daysRemaining < 0) return 'Vaccination expired'
  if (daysRemaining <= VACCINATION_WARNING_WINDOW_DAYS) return `Vaccination expires in ${daysRemaining}d`
  return null
}
