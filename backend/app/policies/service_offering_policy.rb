# Every membership role can view services (customers need to see what's
# bookable); only owner/admin can manage them. There's no destroy action:
# services are deactivated (active: false), not deleted, since past
# bookings still reference their service_offering_id.
class ServiceOfferingPolicy < ApplicationPolicy
  def index? = membership.present?
  def show? = membership.present?
  def create? = owner_or_admin?
  def update? = owner_or_admin?
end
