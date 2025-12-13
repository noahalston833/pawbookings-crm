# Request-local state set once per request (from the session) instead of
# threaded through every method call. Current.business is added once tenant
# resolution exists (see docs/tenancy.md).
class Current < ActiveSupport::CurrentAttributes
  attribute :user
end
