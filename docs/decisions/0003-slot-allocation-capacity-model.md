# 0003: Slot and allocation capacity model

## Status

Accepted

## Context

Daycare, boarding, and training all need "how many spots are left"
answered, but they don't share a natural unit: daycare capacity is
per-business-day, boarding capacity is per-night (and a boarding stay
spans several consecutive nights, all of which need capacity), and
training capacity is per-specific-time-window class. A model with three
different capacity representations (one per service kind) would push
three different code paths through availability calculation and
booking acceptance.

## Decision

Model capacity with two tables regardless of service kind:

- `AvailabilitySlot`: a `(business, service_offering, starts_at,
  ends_at, capacity)` row representing one unit of bookable capacity —
  one row per business day for daycare, one row per class time window
  for training, one row per night for boarding.
- `BookingAllocation`: one row per `(booking, availability_slot)` pair,
  created only when a booking is *accepted*. A boarding booking that
  spans 3 nights creates 3 allocations, one per night's slot.

Remaining capacity for a slot is calculated, not stored, as
`slot.capacity - count(allocations joined to accepted bookings)`. There
is no mutable `remaining_capacity` counter column.

## Consequences

- Availability calculation is one query with a `LEFT JOIN`/subquery
  count per slot, not per-service-kind branching logic.
- Accepting a boarding request that spans multiple nights must lock and
  check *every* night's slot in the same transaction and create *all*
  allocations together, or none — partial acceptance (some nights
  booked, others not) is not a valid state.
- Because capacity is derived, there's no risk of a cached counter
  drifting out of sync with the actual accepted bookings. The cost is
  an aggregate query instead of an O(1) column read — acceptable at
  this project's scale, and revisited only if a specific endpoint's
  query plan shows it's a problem (see docs/performance.md).
