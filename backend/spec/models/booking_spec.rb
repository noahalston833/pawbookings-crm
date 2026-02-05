require 'rails_helper'

RSpec.describe Booking, type: :model do
  it "is valid with a valid factory" do
    expect(build(:booking)).to be_valid
  end

  it "defaults to pending status" do
    expect(create(:booking).status).to eq("pending")
  end

  it "rejects a requested end time at or before the start time" do
    booking = build(:booking, requested_starts_at: 2.days.from_now, requested_ends_at: 1.day.from_now)
    expect(booking).not_to be_valid
    expect(booking.errors[:requested_ends_at]).to be_present
  end

  it "rejects a service offering from a different business" do
    booking = build(:booking, business: create(:business))
    expect(booking).not_to be_valid
    expect(booking.errors[:service_offering]).to be_present
  end

  it "uses optimistic locking" do
    booking = create(:booking)
    stale = Booking.find(booking.id)

    booking.update!(notes: "first update")

    expect { stale.update!(notes: "second update") }.to raise_error(ActiveRecord::StaleObjectError)
  end
end
