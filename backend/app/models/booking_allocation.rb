class BookingAllocation < ApplicationRecord
  belongs_to :booking
  belongs_to :availability_slot

  validate :slot_belongs_to_the_same_business_as_the_booking

  private

  def slot_belongs_to_the_same_business_as_the_booking
    return if booking.nil? || availability_slot.nil?
    return if availability_slot.business_id == booking.business_id

    errors.add(:availability_slot, "must belong to the same business as the booking")
  end
end
