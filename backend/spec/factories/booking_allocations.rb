FactoryBot.define do
  factory :booking_allocation do
    booking
    availability_slot { create(:availability_slot, service_offering: booking.service_offering, business: booking.business) }
  end
end
