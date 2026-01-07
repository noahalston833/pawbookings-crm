class ServiceOffering < ApplicationRecord
  belongs_to :business
  has_many :availability_slots, dependent: :destroy

  enum :service_kind, { daycare: "daycare", training: "training", boarding: "boarding" }, validate: true

  validates :name, presence: true
  validates :default_capacity, numericality: { only_integer: true, greater_than: 0 }
  validates :default_duration_minutes, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
end
