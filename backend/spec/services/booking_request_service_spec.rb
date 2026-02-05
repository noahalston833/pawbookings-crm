require "rails_helper"

RSpec.describe BookingRequestService, type: :model do
  let(:business) { create(:business) }
  let(:offering) { create(:service_offering, business: business) }
  let(:customer) { create(:user) }
  let!(:pet) { create(:pet, business: business, user: customer) }

  before { create(:membership, business: business, user: customer) }

  def call(**overrides)
    described_class.new(
      business: business,
      customer: customer,
      service_offering_id: offering.id,
      pet_ids: [ pet.id ],
      requested_starts_at: 1.day.from_now,
      requested_ends_at: 2.days.from_now,
      **overrides
    ).call
  end

  it "creates a pending booking with its pets" do
    result = call

    expect(result).to be_success
    expect(result.booking).to be_pending
    expect(result.booking.pets).to eq([ pet ])
  end

  it "persists nothing if a pet belongs to someone else" do
    other_pet = create(:pet, business: business)

    expect {
      call(pet_ids: [ other_pet.id ])
    }.not_to change(Booking, :count)
  end

  it "persists nothing if the requested end time is before the start time" do
    expect {
      call(requested_starts_at: 2.days.from_now, requested_ends_at: 1.day.from_now)
    }.not_to change(Booking, :count)
  end
end
