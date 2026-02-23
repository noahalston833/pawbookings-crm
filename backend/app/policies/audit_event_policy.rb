class AuditEventPolicy < ApplicationPolicy
  def index? = owner_or_admin?
end
