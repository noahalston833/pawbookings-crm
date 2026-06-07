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
  #
  # Both guards are callbacks (not a plain `validate`) specifically so they
  # run inside the save/destroy transaction: `validate` runs before any
  # transaction is opened, so a row lock taken there would release again
  # immediately, giving no real protection (see other_owners_exist? below).
  before_destroy :guard_last_owner_removal
  before_update :guard_last_owner_role_change, if: :role_changed?

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
    throw :abort
  end

  # Locks every owner-role membership row for this business (including
  # this one -- its DB row still shows the pre-change role at this point)
  # before counting. Without the lock, two concurrent requests each
  # removing/demoting one of a business's last two owners could both see
  # "another owner still exists" before either commits, leaving zero
  # owners: a classic check-then-act race. Locking the whole owner set
  # here means the second transaction blocks until the first commits, then
  # re-reads a set that no longer includes whichever owner just left.
  def other_owners_exist?
    owner_ids = business.memberships.where(role: "owner").lock.pluck(:id)
    (owner_ids - [ id ]).any?
  end
end
