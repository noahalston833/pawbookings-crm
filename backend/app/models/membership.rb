class Membership < ApplicationRecord
  belongs_to :business
  belongs_to :user

  enum :role, { owner: "owner", admin: "admin", staff: "staff", customer: "customer" }, validate: true

  validates :user_id, uniqueness: {
    scope: :business_id, message: "already has a membership for this business"
  }

  # A business with zero owners can't have its settings, services, or other
  # memberships managed by anyone -- this invariant is enforced here rather
  # than only in the authorization layer so it holds even from the console.
  before_destroy :guard_last_owner_removal
  validate :guard_last_owner_role_change, if: :role_changed?, on: :update

  private

  def guard_last_owner_removal
    return unless owner?
    return if other_owners_exist?

    errors.add(:base, "cannot remove the last owner of a business")
    throw :abort
  end

  def guard_last_owner_role_change
    return unless role_was == "owner"
    return if other_owners_exist?

    errors.add(:role, "cannot change the last owner's role")
  end

  def other_owners_exist?
    business.memberships.owner.where.not(id: id).exists?
  end
end
