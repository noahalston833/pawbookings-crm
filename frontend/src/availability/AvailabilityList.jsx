import PropTypes from 'prop-types'
import Form from 'react-bootstrap/Form'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { formatDateTimeRange } from '../lib/dateTime'
import { remainingCapacityLabel } from '../lib/capacity'
import { availabilityState } from '../lib/availabilityStatus'

// Selecting a slot here does not reserve it -- capacity is only checked
// and reserved when the business accepts the request (docs/decisions/0005).
// The public availability endpoint only ever returns already-active slots
// and so doesn't send an `active` field -- assume true so `availabilityState`
// (shared with the admin-facing views, which do send it) reads correctly.
export function AvailabilityList({ slots, timeZone = 'UTC', selectedIds, onToggle }) {
  if (slots.length === 0) {
    return <EmptyState title="No availability" description="No availability found in the next couple of weeks." />
  }

  return (
    <fieldset className="border-0 p-0">
      <legend className="h6">Choose a date/time (requesting does not guarantee a spot)</legend>
      <div className="d-flex flex-column gap-2">
        {slots.map((slot) => {
          const state = availabilityState({ ...slot, active: true })

          return (
            <label
              key={slot.id}
              className="d-flex align-items-center justify-content-between gap-3 border rounded p-2"
              htmlFor={`availability-slot-${slot.id}`}
            >
              <span className="d-flex align-items-center gap-2">
                <Form.Check
                  type="checkbox"
                  id={`availability-slot-${slot.id}`}
                  checked={selectedIds.includes(slot.id)}
                  disabled={slot.remaining_capacity <= 0}
                  onChange={() => onToggle(slot.id)}
                  className="mb-0"
                />
                {formatDateTimeRange(slot.starts_at, slot.ends_at, timeZone)}
              </span>
              <span className="d-flex align-items-center gap-2 text-nowrap">
                <span className="small text-muted">{remainingCapacityLabel(slot.remaining_capacity, slot.capacity)}</span>
                <StatusBadge label={state.label} variant={state.variant} />
              </span>
            </label>
          )
        })}
      </div>
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

