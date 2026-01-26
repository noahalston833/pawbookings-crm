class IdempotencyRecord < ApplicationRecord
  belongs_to :business
  belongs_to :user

  validates :key, presence: true
  validates :endpoint, presence: true
  validates :request_fingerprint, presence: true
  validates :expires_at, presence: true

  def completed? = completed_at.present?
end
