class AvailabilitySlot < ApplicationRecord
  belongs_to :business
  belongs_to :service_offering
  has_many :booking_allocations, dependent: :restrict_with_error

  validates :capacity, numericality: { only_integer: true, greater_than: 0 }
  validate :ends_at_after_starts_at
  validate :service_offering_belongs_to_same_business

  private

  def ends_at_after_starts_at
    return if starts_at.blank? || ends_at.blank?

    errors.add(:ends_at, "must be after the start time") if ends_at <= starts_at
  end

  # business_id is denormalized onto this table (see docs/tenancy.md) so it
  # can drift from service_offering.business_id if misused; this catches
  # that rather than silently trusting whichever id was passed in.
  def service_offering_belongs_to_same_business
    return if service_offering.nil? || business.nil?
    return if service_offering.business_id == business_id

    errors.add(:service_offering, "must belong to the same business")
  end
end
