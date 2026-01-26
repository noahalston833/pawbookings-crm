FactoryBot.define do
  factory :booking_pet do
    booking
    pet { create(:pet, business: booking.business, user: booking.customer) }
  end
end
