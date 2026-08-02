// A slot's availability isn't a field the API returns directly -- it's
// derived here, once, from capacity/remaining_capacity/active so every
// page (service booking, availability management) agrees on the
// thresholds and labels.
const LOW_CAPACITY_RATIO = 0.25

export function availabilityState(slot) {
  if (!slot.active) return { label: 'Closed', variant: 'secondary' }
  if (slot.remaining_capacity <= 0) return { label: 'Full', variant: 'danger' }

  const lowCapacityThreshold = Math.max(1, Math.ceil(slot.capacity * LOW_CAPACITY_RATIO))
  if (slot.remaining_capacity <= lowCapacityThreshold) return { label: 'Limited availability', variant: 'warning' }

  return { label: 'Available', variant: 'success' }
}
