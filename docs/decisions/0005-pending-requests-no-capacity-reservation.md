# 0005: Pending requests do not reserve capacity

## Status

Accepted

## Context

A booking request could, in principle, provisionally hold a slot the
moment it's submitted (optimistic reservation), or it could hold
nothing until a staff member actually accepts it. Provisional holds
need an expiry/release mechanism (what happens to the hold if staff
never respond?) and make "remaining availability" ambiguous — does it
mean capacity minus accepted bookings, or capacity minus accepted-and-
pending? Customers would see different numbers depending on which
answer the API gives, and a slot could appear full due to stale pending
requests nobody ever acted on.

## Decision

A `pending` booking reserves nothing. Availability shown to customers
is always "capacity minus *accepted* bookings' allocations" — pending
requests are invisible to the capacity calculation. Capacity is only
actually consumed at acceptance time, inside the locked transaction
described in ADR 0003.

## Consequences

- The UI must clearly tell customers that a pending request is not a
  guaranteed booking (see the booking-request form and status history
  copy) — this is a product/communication requirement created directly
  by this decision, not an incidental detail.
- Two customers can both submit pending requests for the same last
  slot; only one can be *accepted*. This is expected and handled by the
  capacity-conflict (`409`) response on the second acceptance attempt,
  not by blocking the second request from being submitted.
- No background job is needed to expire/release holds, because nothing
  was ever held. This is simpler than a reservation-with-TTL design at
  the cost of staff potentially reviewing a request that's no longer
  fulfillable — an acceptable trade for a booking platform where staff
  review requests reasonably promptly, versus, say, a live seat-map
  checkout flow.
