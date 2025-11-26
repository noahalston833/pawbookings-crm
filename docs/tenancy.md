# Tenancy

## The tenant is a `Business`

A `Business` represents one dog daycare/boarding/training company using
the platform (e.g. "Paws & Play Daycare"). Every piece of data that
belongs to a business — pets, services, availability, bookings, audit
events — is scoped to exactly one `Business` via a non-null
`business_id` foreign key.

## Membership instead of a role on `User`

A `User` does not belong to a single business or hold a single global
role. Real users legitimately need to belong to more than one business
(a customer who boards their dog at one place and trains at another; a
staff member who works two locations). The `Membership` model is the
join between `User` and `Business` and is where `role` lives:

```
User has_many :memberships
User has_many :businesses, through: :memberships
Business has_many :memberships
Business has_many :users, through: :memberships
```

See [ADR 0001](decisions/0001-membership-based-tenancy.md) for why this
was chosen over a simpler `user.role` + `user.business_id` design.

## Resolving the current tenant

The tenant is resolved from a stable slug in the URL, not from a
subdomain or a header:

```
/api/v1/businesses/:business_slug/pets
/api/v1/businesses/:business_slug/bookings
```

A slug in the path is simple to test (no wildcard-subdomain DNS/TLS
needed locally), simple to demo, and keeps tenant identity visible and
explicit in every request/log line, including from `curl`.

Resolution happens in a base controller, before any tenant-scoped
action runs:

1. Look up the `Business` by `slug`. If it doesn't exist, respond
   `404` — the same response as "exists but you can't access it" (see
   below).
2. Require an authenticated `User` (see
   [docs/authorization.md](authorization.md), added with the
   authentication milestone).
3. Look up that user's `Membership` in that business. If none exists,
   respond `404`, not `403` — a `403` would confirm the business
   exists and that the requester is merely unauthorized for it, which
   is more information than an outside party needs.
4. Only after both checks pass, set `Current.business` and
   `Current.membership` for the remainder of the request.

```ruby
class Api::V1::TenantScopedController < Api::V1::BaseController
  before_action :set_current_business!

  private

  def set_current_business!
    business = Business.find_by!(slug: params[:business_slug])
    membership = current_user&.memberships&.find_by(business: business)
    raise ActiveRecord::RecordNotFound unless membership

    Current.business = business
    Current.membership = membership
  rescue ActiveRecord::RecordNotFound
    render_not_found # generic 404, see docs on error handling
  end
end
```

## Isolation strategy: application layer, not database RLS

Every query that touches tenant-owned data is written to filter by
`Current.business` explicitly (directly, or via a Pundit policy scope
that does so). There is no Postgres row-level security (RLS) policy
doing this implicitly. See
[ADR 0004](decisions/0004-application-layer-tenant-isolation.md) for
the reasoning — in short: this project may later run on MySQL, which
has no equivalent to Postgres RLS, and relying on RLS would mean the
isolation guarantee silently disappears the moment someone runs a
query outside of the RLS-aware connection role (e.g. a Rails console
session, a one-off script, or a background job that forgets to set
it). An explicit `where(business: Current.business)` in one shared
base controller/policy scope is easier to audit by reading code than a
database-side policy that isn't visible in application source at all.

## No `default_scope`

Tenant scoping is **not** implemented as an Active Record
`default_scope`. `default_scope` is easy to bypass unintentionally
(`unscoped`, raw SQL, associations loaded from a different starting
point), hard to reason about when reading a query in isolation, and
has historically been a common source of accidental cross-tenant leaks
precisely because it look like it's always applied when it isn't.
Scoping instead happens through:

- Pundit policy scopes (`Pardon::Scope#resolve`) used at controller
  action entry points.
- Explicit `business.pets`, `business.bookings`, etc. association
  scoping in services and jobs.

## Background jobs

Jobs never receive an Active Record model to serialize — they receive
a `business_id` (and whatever other record IDs they need) and are
responsible for reloading records and re-establishing tenant context
themselves:

```ruby
class BookingAcceptedNotificationJob < ApplicationJob
  def perform(business_id:, booking_id:)
    business = Business.find(business_id)
    booking = business.bookings.find(booking_id) # scoped through business
    # ...
  end
end
```

Looking the booking up *through* `business.bookings` (not
`Booking.find(booking_id)`) means a bug that passes the wrong
`business_id`/`booking_id` pair fails loudly with `RecordNotFound`
instead of silently operating on another tenant's data.

## Cross-tenant access is tested, not assumed

Tests exist (see [docs/testing.md](testing.md), added with the testing
milestone) proving that a user from Business A gets a `404` — not a
`403`, and not a `200` with someone else's data — for every tenant-owned
resource in Business B: pets, bookings, services, availability, audit
events, and membership management endpoints.

## Optional platform-admin access

A `platform_admin` boolean on `User` is reserved for application
support staff. It grants no implicit access to tenant data by itself —
any code path that lets a platform admin read/act on tenant data must
do so explicitly (there is no "admins bypass the business check"
branch in the shared tenant-resolution code) and must write an
`AuditEvent` recording that a platform admin touched that business's
data. Ordinary membership roles (`owner`, `admin`, `staff`,
`customer`) can never grant themselves `platform_admin`.
