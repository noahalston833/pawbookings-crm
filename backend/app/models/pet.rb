class Pet < ApplicationRecord
  # Pets belong to both a user (the owner) and a business directly --
  # not just derived through the owner's memberships -- so a pet's
  # tenant-owned data (medical/behavioral notes) can never be reached by
  # scoping through the wrong business (see docs/tenancy.md).
  belongs_to :business
  belongs_to :user

  enum :species, { dog: "dog" }, validate: true
  enum :sex, { male: "male", female: "female" }, validate: true
  enum :vaccination_status, { up_to_date: "up_to_date", expired: "expired", unknown: "unknown" },
       validate: true, default: :unknown, prefix: :vaccination
  enum :status, { active: "active", archived: "archived" }, validate: true, default: :active

  validates :name, presence: true
  validates :weight, numericality: { greater_than: 0 }, allow_nil: true
  validate :birth_date_not_in_the_future
  validate :vaccination_expires_on_present_when_up_to_date

  private

  def birth_date_not_in_the_future
    return if birth_date.blank?

    errors.add(:birth_date, "can't be in the future") if birth_date > Date.current
  end

  def vaccination_expires_on_present_when_up_to_date
    return unless vaccination_up_to_date?
    return if vaccination_expires_on.present?

    errors.add(:vaccination_expires_on, "must be set when vaccination status is up to date")
  end
end
