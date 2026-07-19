class Business < ApplicationRecord
  SLUG_FORMAT = /\A[a-z0-9]+(-[a-z0-9]+)*\z/

  has_many :memberships, dependent: :destroy
  has_many :users, through: :memberships
  has_many :pets, dependent: :destroy
  has_many :service_offerings, dependent: :destroy
  has_many :availability_slots, dependent: :destroy
  has_many :bookings, dependent: :destroy
  has_many :idempotency_records, dependent: :destroy
  has_many :audit_events, dependent: :destroy

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true, format: {
    with: SLUG_FORMAT, message: "must be lowercase letters, numbers, and hyphens only"
  }
  validates :time_zone, presence: true
  # ActiveSupport::TimeZone::MAPPING is a small curated list of *friendly
  # display names* for a `time_zone_select`-style dropdown -- it excludes
  # plenty of legitimate IANA identifiers (e.g. "Africa/Abidjan"), which
  # is exactly what the frontend's <select> offers via
  # Intl.supportedValuesOf('timeZone'). Time.find_zone resolves any real
  # IANA identifier tzinfo knows about, matching what the frontend
  # actually lets someone pick.
  validate :time_zone_is_a_valid_iana_identifier

  private

  def time_zone_is_a_valid_iana_identifier
    return if time_zone.blank?
    return if Time.find_zone(time_zone)

    errors.add(:time_zone, "must be a valid IANA time zone")
  end
end
