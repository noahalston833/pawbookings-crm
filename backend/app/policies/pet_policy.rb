# Customers manage only their own pets; staff/admin/owner can view every
# pet in the business for operational purposes (feeding/medication at
# check-in) but only owner/admin can edit -- staff is read-only here.
# There's no destroy action: pets are archived (status update), never
# hard-deleted, since medical/behavioral history stays relevant to past
# bookings.
class PetPolicy < ApplicationPolicy
  def index? = staff_or_above? || customer?
  def show? = staff_or_above? || owns_record?
  def create? = customer?
  def update? = owner_or_admin? || owns_record?

  private

  def owns_record?
    membership.present? && record.user_id == membership.user_id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all unless membership&.customer?

      scope.where(user_id: membership.user_id)
    end
  end
end
