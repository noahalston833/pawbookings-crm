# Testing

## Backend: 182 examples across 32 files (RSpec)

```
backend/spec/
├── models/      Validations, callbacks, and model-level invariants
│                (e.g. Membership's last-owner protection)
├── services/    Business logic in isolation (BookingAcceptance,
│                IdempotentOperation, BusinessSignup, ...)
├── requests/    Full HTTP stack: routing, tenant resolution,
│                authorization, and JSON response shape together
└── jobs/        Background job behavior (idempotent notification
                 sends, the idempotency-record cleanup job)
```

Run everything:

```
cd backend
bundle exec rspec
```

## Why request specs, not policy-only unit tests, for authorization

There is no `spec/policies/` directory. Every Pundit policy is
exercised through request specs instead — logging in as each role and
asserting the actual HTTP status/response for each endpoint (see
`spec/requests/api/v1/businesses/memberships_spec.rb` for the fullest
example: owner/admin/staff/customer × every action). A policy unit test
in isolation can pass while the controller still forgets to call
`authorize` at all; a request spec catches both at once, and reads as
the actual behavioral contract ("an admin gets a 403 here") rather than
an implementation detail of one Ruby class.

## Cross-tenant isolation is tested per resource, not assumed from one

Every tenant-owned resource (pets, service offerings, availability
slots, bookings, memberships, audit events) has a request spec proving
a user authenticated in Business A gets a `404` — not a `403`, and not
someone else's data — when given an id that belongs to Business B. This
is deliberately repetitive rather than "proven once and trusted
everywhere": each controller independently calls
`Current.business.<association>.find(id)`, so a typo or refactor in
*any one* of them (e.g. someone changes it to `Model.find(id)` while
"simplifying" a controller) is a tenant-isolation regression that only
a test scoped to *that* resource will catch.

## Concurrency: real threads, not mocked locks

A handful of specs (tagged `:concurrency`) spawn actual OS threads
against real, separately-committed database connections to prove a
race is actually prevented — not just that the locking code *looks*
correct:

```ruby
it "does not overbook the last available place under concurrent acceptance", :concurrency do
  ActiveRecord::Base.connection_pool.disconnect!
  results = []
  mutex = Mutex.new
  started = 0

  [booking_a, booking_b].map do |booking|
    Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do
        mutex.synchronize { started += 1 }
        sleep 0.01 until started == 2 # line the threads up to race

        result = BookingAcceptance.new(booking: booking).call
        mutex.synchronize { results << result }
      end
    end
  end.each(&:join)

  expect(results.count(&:success?)).to eq(1)
end
```

This pattern (disconnect the pool first, each thread claims its own
connection via `with_connection`, a mutex-guarded counter lines the
threads up so they actually race instead of running sequentially) is
reused for every concurrency spec: idempotent request races, booking
acceptance capacity races, a concurrent accept-and-deny of the same
booking, and the last-owner-membership removal race.

The default per-example transaction (rolled back, never committed)
would hide one thread's writes from another entirely, so these specs
use `DatabaseCleaner`'s `:truncation` strategy instead of `:transaction`
— configured in `rails_helper.rb` to switch automatically based on the
`:concurrency` tag, so this is invisible to every other spec.

## N+1 / eager-loading regressions fail the suite

`Bullet` is enabled in the test environment with `Bullet.raise = true`
— see [docs/performance.md](performance.md). Any new list endpoint that
introduces an N+1 query, or keeps an `.includes` no one reads, fails
whatever spec exercises it, immediately, rather than being caught (or
not) in code review.

## Frontend: 16 tests across 7 files (Vitest + React Testing Library)

```
cd frontend
npm test
```

Covers the interactive flows most likely to regress silently: login
(credential submission, server error display), pet creation (species
forced to `dog`, validation error display), availability display
(remaining-capacity-aware disabling), booking request (idempotency-key
header, submit-disabled-until-valid), booking decisions (role-gated
accept/deny controls), service creation, and membership role changes
(role options correctly excluding "owner" for an admin viewer).

Components that call `useAuth()` are rendered under a real
`AuthProvider` in tests (not a mocked context value) with `../api/client`
mocked at the module level — `client.get('/session')` resolves or
rejects to simulate "logged in as this role" or "logged out," which
exercises the actual auth-restoration flow rather than a stand-in.

## What isn't covered (and why that's a deliberate line, not an oversight)

- No end-to-end/browser tests (Playwright/Cypress) — request specs
  already exercise the real HTTP/JSON contract the frontend depends on,
  and component tests already exercise real user interaction against
  real (mocked-at-the-network-boundary) components. A full browser E2E
  suite would mostly re-prove the same contracts at much higher cost
  and flakiness for this project's scope.
- No load/performance testing tooling — see
  [docs/performance.md](performance.md) for how performance is
  reasoned about instead (index/query-shape review plus Bullet's N+1
  detection), which is proportionate to a project that has never run
  under real production traffic.
