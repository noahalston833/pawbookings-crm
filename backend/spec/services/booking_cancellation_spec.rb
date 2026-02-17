require "rails_helper"

RSpec.describe BookingCancellation, type: :model do
  it "cancels a pending booking" do
    booking = create(:booking)

    result = described_class.new(booking: booking).call

    expect(result).to be_success
    expect(result.booking.reload).to be_cancelled
  end

  it "cancels an accepted booking and releases its allocations" do
    booking = create(:booking, :accepted)
    allocation = create(:booking_allocation, booking: booking)

    result = described_class.new(booking: booking).call

    expect(result).to be_success
    expect(result.booking.reload).to be_cancelled
    expect(BookingAllocation.exists?(allocation.id)).to be(false)
  end

  it "rejects cancelling an already-denied booking predictably" do
    booking = create(:booking, :denied)

    result = described_class.new(booking: booking).call

    expect(result).not_to be_success
    expect(result.error_code).to eq("invalid_state_transition")
  end

  it "rejects cancelling an already-cancelled booking predictably (repeat attempts are safe)" do
    booking = create(:booking)
    described_class.new(booking: booking).call

    result = described_class.new(booking: booking).call

    expect(result).not_to be_success
    expect(result.error_code).to eq("invalid_state_transition")
  end
end
