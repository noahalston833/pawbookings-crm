# 0001: Membership-based tenancy instead of a role/business on `User`

## Status

Accepted

## Context

The simplest possible design would put `business_id` and `role`
directly on `User`. That works only if a user can belong to exactly
one business, ever. Real users in this domain don't fit that: a
customer may board their dog at one business and take training classes
at another; a staff member may work at two locations. A direct
`user.business_id` would force either duplicate `User` rows per
business (breaking login-once-across-businesses and email uniqueness)
or an artificial one-business-per-user restriction with no product
justification.

## Decision

Introduce a `Membership` join model between `User` and `Business`
carrying `role`. A user has many memberships and many businesses
through memberships; a business has many memberships and many users
through memberships. Role-based authorization checks operate on the
membership for the *current* business (`Current.membership`), never on
a global user attribute.

## Consequences

- Registration flows create a `Membership`, not a `User` column update
  (see the business-signup and customer-registration transactions).
- Every authorization check needs the business in scope first (tenant
  resolution happens before role checks — see docs/tenancy.md).
- Slightly more joins than a denormalized `user.role` column, which is
  a fine trade for correctness here; the membership lookup is indexed
  on `(business_id, user_id)`.
