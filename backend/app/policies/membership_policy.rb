# Owner: full control over memberships, including changing/removing owners
# (the model layer still blocks removing the business's last owner).
# Admin: can manage staff/customer memberships but can neither grant owner
# nor touch an existing owner's membership (spec: "cannot remove the last
# owner or grant owner privileges" -- read here as "no owner-level access
# at all", which is simpler to reason about than a last-owner-only carve
# out and just as safe).
# Staff/customer: no access to membership management.
class MembershipPolicy < ApplicationPolicy
  def index?
    owner_or_admin?
  end

  def update?
    return false unless owner_or_admin?
    return true if owner?

    # record has the *attempted* new attributes assigned (but not yet
    # saved) by the controller before authorize is called, so record.role
    # is the requested value and record.role_was is the current one.
    record.role_was != "owner" && record.role != "owner"
  end

  def destroy?
    return false unless owner_or_admin?
    return true if owner?

    !record.owner?
  end
end
