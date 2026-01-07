# Same shape as ServiceOfferingPolicy: everyone in the business can view
# availability, only owner/admin manage it, and slots are deactivated
# rather than destroyed (bookings may already reference them through
# BookingAllocation once that exists).
class AvailabilitySlotPolicy < ApplicationPolicy
  def index? = membership.present?
  def show? = membership.present?
  def create? = owner_or_admin?
  def update? = owner_or_admin?
end
