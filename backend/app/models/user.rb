class User < ApplicationRecord
  has_secure_password

  normalizes :email, with: ->(email) { email.strip.downcase }

  has_many :memberships, dependent: :destroy
  has_many :businesses, through: :memberships
  has_many :pets, dependent: :destroy
  has_many :bookings, foreign_key: :customer_id, inverse_of: :customer, dependent: :destroy

  validates :email, presence: true, uniqueness: { case_sensitive: false },
                     format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, allow_nil: true
end
