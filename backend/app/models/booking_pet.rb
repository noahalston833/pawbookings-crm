class BookingPet < ApplicationRecord
  belongs_to :booking
  belongs_to :pet

  validate :pet_belongs_to_the_requesting_customer_and_business

  private

  def pet_belongs_to_the_requesting_customer_and_business
    return if pet.nil? || booking.nil?

    if pet.business_id != booking.business_id
      errors.add(:pet, "must belong to the same business as the booking")
    elsif pet.user_id != booking.customer_id
      errors.add(:pet, "must belong to the customer making the booking")
    end
  end
end
