// Vanilla-JS IANA time zone conversion (no date library in this project).
// The backend stores/returns UTC instants; staff think and type in the
// business's local wall-clock time, so slot creation/editing needs to
// convert between the two explicitly rather than relying on the browser's
// own (unrelated) local time zone.

// "YYYY-MM-DDTHH:mm" (as typed into a <input type="datetime-local">,
// meant as wall-clock time in `timeZone`) -> UTC ISO string for the API.
export function zonedTimeToUtcIso(dateTimeLocalValue, timeZone) {
  const naiveUtc = new Date(`${dateTimeLocalValue}:00Z`)
  const zonedPartsIfItWereUtc = formatInTimeZone(naiveUtc, timeZone)
  const offsetMs = Date.UTC(...zonedPartsIfItWereUtc) - naiveUtc.getTime()
  return new Date(naiveUtc.getTime() - offsetMs).toISOString()
}

// A sensible default for "what time zone is this business/visitor in"
// pickers. Deliberately NOT a hardcoded 'UTC' string: that value isn't
// itself included in every engine's Intl.supportedValuesOf('timeZone')
// list, so using it as a controlled <select>'s initial state can silently
// mismatch what the browser actually renders as selected.
export function detectTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}


// UTC ISO string from the API -> "YYYY-MM-DDTHH:mm" for pre-filling a
// <input type="datetime-local"> with the business's local wall-clock time.
export function utcIsoToZonedInputValue(isoString, timeZone) {
  const [ year, month, day, hour, minute ] = formatInTimeZone(new Date(isoString), timeZone)
  const pad = (value) => String(value).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`
}

function formatInTimeZone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [ part.type, part.value ]))
  // Some engines format midnight as hour "24" under hour12: false.
  const hour = parts.hour === '24' ? '00' : parts.hour

  return [
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(hour), Number(parts.minute), Number(parts.second),
  ]
}
