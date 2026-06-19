# Performance

## N+1 queries: caught by tooling, not just code review

The `bullet` gem (dev/test only) watches every request/query in the
test suite and **raises** on an N+1 query or unused eager-loading —
a regression fails the suite immediately instead of only showing up
later as a slow endpoint in production. In development it logs instead
of raising. See `config/environments/{test,development}.rb`.

This caught a real issue during the milestone 15 audit:
`AuditEventsController#index` eager-loaded the polymorphic `:target`
association, but `event_json` only ever reads `target_type`/`target_id`
(plain columns on `audit_events` itself) — the eager load was pure
waste. Fixed by removing it. The general pattern used everywhere lists
are rendered:

```ruby
# BookingsController#index
policy_scope(Current.business.bookings)
  .includes(:service_offering, :customer, :pets)
  .order(created_at: :desc)
```

`.includes` only lists associations the JSON serializer actually
touches for that endpoint — not "everything the model has," which
would just trade an N+1 for wasted joins/queries in the other
direction.

## The one deliberately-not-`.includes` case: aggregate counts

The customer-facing availability endpoint
(`AvailabilitiesController#index`) needs each slot's *remaining*
capacity, which requires knowing how many bookings have already been
accepted against it. Rather than looping over slots and querying
per-slot (an N+1 by construction, `.includes` can't fix a computed
aggregate), it runs one query covering every slot on the page:

```ruby
def accepted_allocation_counts(slots)
  return {} if slots.empty?

  BookingAllocation.joins(:booking)
                    .where(availability_slot_id: slots.map(&:id))
                    .merge(Booking.where(status: "accepted"))
                    .group(:availability_slot_id)
                    .count
end
```

This scales with the number of *distinct slots on one page*, not the
number of bookings ever made against them.

## Pagination: plain limit/offset, capped

No cursor-based pagination, no `kaminari`/`will_paginate` dependency —
`Paginatable` (`app/controllers/concerns/paginatable.rb`) is a shared
`page`/`per_page` concern (default 25, capped at 100) used by every
list endpoint (bookings, pets, memberships, audit events). Endpoints
return a plain JSON array, not an envelope with pagination metadata —
the frontend treats "fewer than `per_page` rows came back" as the
signal that it has reached the last page (see `useAuditEvents.js`'s
`getNextPageParam`), rather than the server computing and returning a
total count on every request just to support "is there a next page."

The frontend's booking queue used to fetch every booking and filter by
status client-side. That's wrong once a business accumulates history
beyond one page (pagination already caps the fetch at 25) — filtering
client-side would silently hide older bookings matching the selected
status. Fixed in milestone 15: `GET .../bookings` now accepts an
optional `?status=` and the frontend issues the filtered request
server-side instead (`useBookings.js`, a `useInfiniteQuery` with a
"Load more" button).

## Indexes: matched to actual query shapes, not just foreign keys

Every foreign key has a supporting index (Rails' `t.references`
default), but a few composite indexes exist specifically for how a
column is *actually* queried together with others:

| Index | Serves |
|---|---|
| `bookings(business_id, status, created_at)` | `GET .../bookings?status=X`, ordered by recency |
| `bookings(business_id, created_at)` | `GET .../bookings` unfiltered — a 3-column index grouped by `status` first can't serve `ORDER BY created_at` alone efficiently |
| `availability_slots(service_offering_id, active, starts_at)` | the customer-facing availability query (`WHERE active = true AND starts_at BETWEEN ...`) |
| `availability_slots(service_offering_id, starts_at, ends_at)` (unique) | prevents duplicate slot windows *and* serves the plain management list ordered by `starts_at` |
| `idempotency_records(business_id, user_id, endpoint, key)` (unique) | the actual concurrency guarantee — see [docs/idempotency.md](idempotency.md) |
| `memberships(business_id, user_id)` (unique) | tenant membership resolution on every single request |

A plain `bookings(business_id, status)` index existed briefly during
development (added proactively) but was removed once it became clear
no query actually used it in that shape — the 3-column index above is
a strict superset for anything it could have served.

## Booking acceptance: correct locking, not just "add an index"

Accepting a booking is the one place capacity is actually checked and
spent, so it needs row locks, not just an index — see
[ADR 0003](decisions/0003-slot-allocation-capacity-model.md) for the
model and [docs/testing.md](testing.md) for how the "two concurrent
acceptances for the last spot" race is actually tested. The
performance-relevant detail: every required slot is locked in a single
query, in a consistent order (`.order(:id).lock`), so two concurrent
acceptances that both need overlapping slots block briefly on each
other rather than deadlocking.

## No caching layer

Nothing in this app is read-heavy enough yet to justify a cache and
its invalidation complexity — Solid Cache was removed from the Rails 8
default scaffold entirely (see `docs/architecture.md`). If a
`GET .../service_offerings` or `GET .../availability` endpoint ever
became a real hot path at a scale where the database itself is the
bottleneck (not just "a query could be one query instead of five"),
the design already anticipates a straightforward per-business cache
key (`Current.business.cache_key_with_version`), invalidated the same
way audit-logged mutations already tag their target — but that's
speculative infrastructure with no current query pattern to justify it,
so it isn't built.
