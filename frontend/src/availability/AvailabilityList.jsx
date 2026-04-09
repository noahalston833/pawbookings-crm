import PropTypes from 'prop-types'

function formatSlot(slot, timeZone) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  return `${formatter.format(new Date(slot.starts_at))} – ${formatter.format(new Date(slot.ends_at))}`
}

// Selecting a slot here does not reserve it -- capacity is only checked
// and reserved when the business accepts the request (docs/decisions/0005).
export function AvailabilityList({ slots, timeZone = 'UTC', selectedIds, onToggle }) {
  if (slots.length === 0) {
    return <p>No availability found in the next couple of weeks.</p>
  }

  return (
    <fieldset>
      <legend>Choose a date/time (requesting does not guarantee a spot)</legend>
      <ul>
        {slots.map((slot) => (
          <li key={slot.id}>
            <label>
              <input
                type="checkbox"
                checked={selectedIds.includes(slot.id)}
                disabled={slot.remaining_capacity <= 0}
                onChange={() => onToggle(slot.id)}
              />
              {' '}
              {formatSlot(slot, timeZone)} — {slot.remaining_capacity} of {slot.capacity} remaining
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  )
}

AvailabilityList.propTypes = {
  slots: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    starts_at: PropTypes.string.isRequired,
    ends_at: PropTypes.string.isRequired,
    capacity: PropTypes.number.isRequired,
    remaining_capacity: PropTypes.number.isRequired,
  })).isRequired,
  timeZone: PropTypes.string,
  selectedIds: PropTypes.arrayOf(PropTypes.number).isRequired,
  onToggle: PropTypes.func.isRequired,
}
