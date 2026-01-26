class Booking < ApplicationRecord
  belongs_to :business
  belongs_to :customer, class_name: "User"
  belongs_to :service_offering
  has_many :booking_pets, dependent: :destroy
  has_many :pets, through: :booking_pets

  enum :status, { pending: "pending", accepted: "accepted", denied: "denied", cancelled: "cancelled", completed: "completed" },
       validate: true, default: :pending

  validates :requested_starts_at, presence: true
  validates :requested_ends_at, presence: true
  validate :ends_after_starts
  validate :service_offering_belongs_to_same_business

  private

  def ends_after_starts
    return if requested_starts_at.blank? || requested_ends_at.blank?

    errors.add(:requested_ends_at, "must be after the requested start time") if requested_ends_at <= requested_starts_at
  end

  def service_offering_belongs_to_same_business
    return if service_offering.nil? || business.nil?
    return if service_offering.business_id == business_id

    errors.add(:service_offering, "must belong to the same business")
  end
end
