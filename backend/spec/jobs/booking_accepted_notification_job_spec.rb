require "rails_helper"

RSpec.describe BookingAcceptedNotificationJob, type: :job do
  it "sends exactly one email even if the job is executed twice" do
    booking = create(:booking, :accepted)

    expect {
      2.times { described_class.perform_now(business_id: booking.business_id, booking_id: booking.id) }
    }.to change { ActionMailer::Base.deliveries.count }.by(1)

    expect(booking.reload.notified_at).to be_present
  end

  it "does not send anything for a booking that is no longer accepted" do
    booking = create(:booking, :denied)

    expect {
      described_class.perform_now(business_id: booking.business_id, booking_id: booking.id)
    }.not_to change { ActionMailer::Base.deliveries.count }
  end

  it "discards gracefully if the booking no longer exists in that business" do
    other_business = create(:business)

    expect {
      described_class.perform_now(business_id: other_business.id, booking_id: -1)
    }.not_to raise_error
  end
end
