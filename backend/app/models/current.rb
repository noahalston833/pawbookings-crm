# Request-local state set once per request (from the session/URL) instead
# of threaded through every method call. business/membership are only set
# after tenant resolution succeeds (see docs/tenancy.md) -- never assume
# either is present outside a tenant-scoped controller.
class Current < ActiveSupport::CurrentAttributes
  attribute :user
  attribute :business
  attribute :membership
end
