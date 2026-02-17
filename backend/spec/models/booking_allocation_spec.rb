require 'rails_helper'

RSpec.describe BookingAllocation, type: :model do
  it "is valid with a valid factory" do
    expect(create(:booking_allocation)).to be_valid
  end

  it "rejects an availability slot from a different business than the booking" do
    booking = create(:booking)
    other_slot = create(:availability_slot)

    allocation = build(:booking_allocation, booking: booking, availability_slot: other_slot)
    expect(allocation).not_to be_valid
    expect(allocation.errors[:availability_slot]).to be_present
  end

  it "rejects the same slot allocated twice to the same booking" do
    allocation = create(:booking_allocation)
    duplicate = build(:booking_allocation, booking: allocation.booking, availability_slot: allocation.availability_slot)

    expect { duplicate.save!(validate: false) }.to raise_error(ActiveRecord::RecordNotUnique)
  end
end
