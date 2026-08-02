// Capacity is always shown as text (e.g. "14 of 20 reserved"), never a
// bar/color alone, so the number is legible without relying on width or hue.
export function reservedCapacityLabel(reserved, total) {
  return `${reserved} of ${total} reserved`
}

export function remainingCapacityLabel(remaining, total) {
  return `${remaining} of ${total} remaining`
}

export function reservedCapacityPercent(reserved, total) {
  if (total <= 0) return 0
  return Math.min(100, Math.round((reserved / total) * 100))
}
