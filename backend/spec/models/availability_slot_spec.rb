require 'rails_helper'

RSpec.describe AvailabilitySlot, type: :model do
  it "is valid with a valid factory" do
    expect(build(:availability_slot)).to be_valid
  end

  it "rejects a non-positive capacity" do
    slot = build(:availability_slot, capacity: 0)
    expect(slot).not_to be_valid
    expect(slot.errors[:capacity]).to be_present
  end

  it "rejects an end time at or before the start time" do
    now = Time.zone.now
    slot = build(:availability_slot, starts_at: now, ends_at: now)
    expect(slot).not_to be_valid
    expect(slot.errors[:ends_at]).to be_present
  end

  it "rejects a service offering from a different business" do
    slot = build(:availability_slot, business: create(:business))
    expect(slot).not_to be_valid
    expect(slot.errors[:service_offering]).to be_present
  end
end
