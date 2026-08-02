// Centralized so status->color/label mapping is never duplicated across
// pages. `variant` values are Bootstrap theme colors, consumed by
// StatusBadge (bg-{variant}-subtle text-{variant}-emphasis).
const BOOKING_STATUS_META = {
  pending: { label: 'Pending', variant: 'warning' },
  accepted: { label: 'Accepted', variant: 'success' },
  denied: { label: 'Denied', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'info' },
}

export const BOOKING_STATUSES = Object.keys(BOOKING_STATUS_META)

export function bookingStatusLabel(status) {
  return BOOKING_STATUS_META[status]?.label ?? status
}

export function bookingStatusVariant(status) {
  return BOOKING_STATUS_META[status]?.variant ?? 'secondary'
}
