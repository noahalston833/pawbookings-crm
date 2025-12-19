# Pundit policies receive the caller's Membership (see
# ApplicationController#pundit_user), not the raw User -- "role" only
# means something in the context of one business.
class ApplicationPolicy
  attr_reader :membership, :record

  def initialize(membership, record)
    @membership = membership
    @record = record
  end

  def index? = false
  def show? = false
  def create? = false
  def new? = create?
  def update? = false
  def destroy? = false
  def edit? = update?

  private

  def owner? = membership&.owner? || false
  def admin? = membership&.admin? || false
  def staff? = membership&.staff? || false
  def customer? = membership&.customer? || false
  def owner_or_admin? = owner? || admin?
  def staff_or_above? = owner? || admin? || staff?

  class Scope
    def initialize(membership, scope)
      @membership = membership
      @scope = scope
    end

    def resolve
      raise NotImplementedError, "#{self.class} must implement #resolve"
    end

    private

    attr_reader :membership, :scope
  end
end
