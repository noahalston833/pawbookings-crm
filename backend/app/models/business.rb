class Business < ApplicationRecord
  SLUG_FORMAT = /\A[a-z0-9]+(-[a-z0-9]+)*\z/

  has_many :memberships, dependent: :destroy
  has_many :users, through: :memberships
  has_many :pets, dependent: :destroy
  has_many :service_offerings, dependent: :destroy
  has_many :availability_slots, dependent: :destroy
  has_many :bookings, dependent: :destroy
  has_many :idempotency_records, dependent: :destroy

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true, format: {
    with: SLUG_FORMAT, message: "must be lowercase letters, numbers, and hyphens only"
  }
  # Rails' own timezone mapping is used as the valid set so this matches
  # what ActiveSupport::TimeZone (used for rendering) actually recognizes.
  validates :time_zone, presence: true, inclusion: {
    in: ActiveSupport::TimeZone::MAPPING.values, message: "must be a valid IANA time zone"
  }
end
