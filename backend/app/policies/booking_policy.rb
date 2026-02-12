# Only customers create booking requests (spec: "a customer chooses...").
# Everyone in the business can see the queue for operational purposes;
# customers only see their own bookings (Scope).
class BookingPolicy < ApplicationPolicy
  def index? = membership.present?
  def show? = staff_or_above? || owns_record?
  def create? = customer?
  def accept? = owner_or_admin?
  def deny? = owner_or_admin?
  # Owner/admin can cancel on the customer's behalf (e.g. a weather
  # closure); staff cannot -- booking decisions stay owner/admin only.
  def cancel? = owner_or_admin? || owns_record?

  private

  def owns_record?
    membership.present? && record.customer_id == membership.user_id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if membership && (membership.owner? || membership.admin? || membership.staff?)

      scope.where(customer_id: membership&.user_id)
    end
  end
end
