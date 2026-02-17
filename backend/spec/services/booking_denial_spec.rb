require "rails_helper"

RSpec.describe BookingDenial, type: :model do
  it "denies a pending booking with a reason" do
    booking = create(:booking)

    result = described_class.new(booking: booking, reason: "Fully booked that week").call

    expect(result).to be_success
    expect(result.booking.reload).to be_denied
    expect(result.booking.denial_reason).to eq("Fully booked that week")
  end

  it "rejects denying an already-decided booking predictably" do
    booking = create(:booking, :accepted)

    result = described_class.new(booking: booking).call

    expect(result).not_to be_success
    expect(result.error_code).to eq("invalid_state_transition")
  end
end
