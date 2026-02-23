# Business settings (name, time zone, policy-level settings) are
# owner-only to change -- unlike services/availability/bookings, this
# isn't in admin's permission list in the spec, and getting it wrong
# (e.g. an admin changing the cancellation policy) has business-wide
# consequences an operational admin role shouldn't carry alone.
class BusinessPolicy < ApplicationPolicy
  def show_settings? = owner_or_admin?
  def update_settings? = owner?
end
