require 'rails_helper'

RSpec.describe BookingPet, type: :model do
  it "is valid with a valid factory" do
    expect(create(:booking_pet)).to be_valid
  end

  it "rejects a pet belonging to a different business than the booking" do
    booking = create(:booking)
    other_pet = create(:pet, business: create(:business))

    booking_pet = build(:booking_pet, booking: booking, pet: other_pet)
    expect(booking_pet).not_to be_valid
    expect(booking_pet.errors[:pet]).to be_present
  end

  it "rejects a pet that does not belong to the booking's customer" do
    booking = create(:booking)
    someone_elses_pet = create(:pet, business: booking.business)

    booking_pet = build(:booking_pet, booking: booking, pet: someone_elses_pet)
    expect(booking_pet).not_to be_valid
    expect(booking_pet.errors[:pet]).to be_present
  end

  it "rejects the same pet added twice to the same booking" do
    booking = create(:booking)
    pet = create(:pet, business: booking.business, user: booking.customer)
    create(:booking_pet, booking: booking, pet: pet)

    duplicate = build(:booking_pet, booking: booking, pet: pet)
    expect { duplicate.save!(validate: false) }.to raise_error(ActiveRecord::RecordNotUnique)
  end
end
