# Authorization

## Pundit, policy-per-model, no controller-embedded role checks

Every controller action that touches a specific record calls
`authorize record` (or `authorize Model, :action?` for actions without
one yet, like `index`/`create`). There are no `if current_user.role ==
"owner"` checks scattered through controllers — a policy class per
model is the single place that role's permissions are decided, and it's
independently unit-testable without spinning up a request.

## Policies receive a `Membership`, not a `User`

```ruby
# ApplicationController
def pundit_user
  Current.membership
end

# ApplicationPolicy
def initialize(membership, record)
  @membership = membership
  @record = record
end
```

A raw `User` has no role by itself — [role only means something in the
context of one business](tenancy.md) (the same person can be an owner
of one business and a customer of another). `Current.membership` is
already resolved to the right business by
`TenantScopedController#set_current_business!` before any policy runs,
so every policy can just read `membership.role` for *this* request's
business without re-deriving it.

## Shared role helpers

`ApplicationPolicy` provides private helpers every concrete policy
builds on instead of re-deriving role checks:

```ruby
def owner? = membership&.owner? || false
def admin? = membership&.admin? || false
def staff? = membership&.staff? || false
def customer? = membership&.customer? || false
def owner_or_admin? = owner? || admin?
def staff_or_above? = owner? || admin? || staff?
```

All four return `false` (not raise) when `membership` is `nil` — this
matters for the public/no-membership case (see below) and keeps every
concrete policy method a simple boolean expression.

## Role capability matrix

| Action | Owner | Admin | Staff | Customer |
|---|---|---|---|---|
| View services/availability | ✅ | ✅ | ✅ | ✅ |
| Create/edit services & availability slots | ✅ | ✅ | ❌ | ❌ |
| Request a booking | ❌* | ❌* | ❌* | ✅ |
| View the booking queue (all bookings) | ✅ | ✅ | ✅ | own only |
| Accept / deny a booking | ✅ | ✅ | ❌ | ❌ |
| Cancel a booking | ✅ (any) | ✅ (any) | ❌ | own only |
| View / add / archive pets | ✅ (view all, edit any) | ✅ (view all, edit any) | view all, no edit | own only |
| List members | ✅ | ✅ | ❌ | ❌ |
| Change a member's role | ✅ (any, incl. granting owner) | ✅ (never touches an owner, never grants owner) | ❌ | ❌ |
| Remove a member | ✅ (any, but never the last owner) | ✅ (never an owner) | ❌ | ❌ |
| View audit log | ✅ | ✅ | ❌ | ❌ |
| View business settings | ✅ | ✅ | ❌ | ❌ |
| Change business settings | ✅ | ❌ | ❌ | ❌ |

\* Nobody with an owner/admin/staff membership can request a booking
*as that membership* — `BookingPolicy#create? = customer?`. A staff
member who is *also* a customer of the same business would need a
separate customer membership to book (memberships are one role per
user per business — see [ADR 0001](decisions/0001-membership-based-tenancy.md)).

Staff is deliberately **not** "admin minus a few things" — it has no
write access to services, availability, bookings decisions, or
memberships at all. Its only affordance beyond a customer's is reading
the full (not just "my own") pet directory and booking queue, for
day-to-day operational purposes (checking a dog in, seeing what's
booked today).

## Attribute-dependent authorization: assign, then authorize

Some decisions depend on the *attempted new value*, not just the
current record — most notably `MembershipPolicy#update?`, which must
tell "admin changes a customer to staff" (allowed) apart from "admin
changes a staff member to owner" (forbidden) apart from "admin changes
the owner's role to anything" (forbidden), all on the exact same
`update` action. The controller assigns the attempted change *before*
calling `authorize`, so the policy can compare the new value against
the persisted one:

```ruby
# MembershipsController#update
membership.assign_attributes(membership_params)
authorize membership # not yet saved

# MembershipPolicy
def update?
  return false unless owner_or_admin?
  return true if owner?

  record.role_was != "owner" && record.role != "owner"
end
```

`record.role` is the attempted (unsaved) value; `record.role_was` is
whatever is still persisted in the database. If authorization fails,
`membership.assign_attributes` is simply discarded without a `save`.

## Policy scopes: what a role can *see* in a list

`index` actions apply `policy_scope` (or an equivalent explicit
`business.pets`/`.bookings` scoping in a couple of controllers written
before scopes were introduced) rather than filtering in the view layer:

```ruby
# BookingPolicy::Scope
def resolve
  return scope.all if membership && (membership.owner? || membership.admin? || membership.staff?)

  scope.where(customer_id: membership&.user_id)
end
```

The same `GET .../bookings` endpoint returns every booking to
owner/admin/staff and only the caller's own to a customer — the
controller code doesn't know or care which; the scope decides. The
React dashboard leans on this directly: the pending-request queue and
"my bookings" are the same route, same hook, and same page component,
just rendering different controls depending on the caller's role,
rather than two parallel screens fetching the same data two different
ways.

## 404, not 403, for cross-tenant access

A user with no membership in a business gets a `404` when they try to
reach any of its resources — not a `403`, which would confirm the
business exists and that they're merely unauthorized for it. This
happens in `TenantScopedController`, *before* any Pundit policy runs
(see [docs/tenancy.md](tenancy.md)). A `403` from Pundit only ever
happens once tenant membership is already established — i.e. "you're a
member of this business, but not the right role for this."

## Business-level (not model-level) authorization

Business settings aren't a `has_one` model of their own — `authorize
Current.business, :show_settings?` and `:update_settings?` are called
directly against the `Business` record with custom policy action
names, since "can view/edit this business's settings" doesn't map to
the standard `show?`/`update?` CRUD verbs Pundit expects for a plain
resource.

## What Pundit does *not* protect against

Pundit governs whether an *authenticated, tenant-resolved* request is
allowed to perform an action — it has no opinion on whether the
business/record being acted on even exists (that's `ActiveRecord::
RecordNotFound`, handled by `TenantScopedController` and
`ErrorHandling`), and no opinion on request forgery, rate limiting, or
session validity (handled separately — CSRF via
`ActionController::RequestForgeryProtection`, login throttling via
`Rails.cache`-backed `rate_limit`, and the session cookie itself, see
[ADR 0002](decisions/0002-cookie-sessions.md)).
