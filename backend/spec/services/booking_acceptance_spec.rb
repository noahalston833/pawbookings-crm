require "rails_helper"

RSpec.describe BookingAcceptance, type: :model do
  let(:business) { create(:business) }
  let(:offering) { create(:service_offering, business: business) }
  let(:customer) { create(:user) }
  let!(:pet) { create(:pet, business: business, user: customer) }

  before { create(:membership, business: business, user: customer) }

  def make_booking(starts_at:, ends_at:)
    booking = business.bookings.create!(
      customer: customer, service_offering: offering,
      requested_starts_at: starts_at, requested_ends_at: ends_at
    )
    booking.booking_pets.create!(pet: pet)
    booking
  end

  it "accepts a pending booking and creates an allocation when capacity exists" do
    slot = create(:availability_slot, service_offering: offering, business: business,
                                       starts_at: 1.day.from_now, ends_at: 2.days.from_now, capacity: 1)
    booking = make_booking(starts_at: slot.starts_at, ends_at: slot.ends_at)

    result = described_class.new(booking: booking).call

    expect(result).to be_success
    expect(result.booking.reload).to be_accepted
    expect(result.booking.booking_allocations.pluck(:availability_slot_id)).to eq([ slot.id ])
  end

  it "reserves every required night for a multi-night boarding booking, or none" do
    boarding = create(:service_offering, :boarding, business: business)
    night1 = create(:availability_slot, service_offering: boarding, business: business,
                                         starts_at: 1.day.from_now, ends_at: 2.days.from_now, capacity: 3)
    night2 = create(:availability_slot, service_offering: boarding, business: business,
                                         starts_at: 2.days.from_now, ends_at: 3.days.from_now, capacity: 1)
    other_customer_booking = business.bookings.create!(
      customer: create(:user), service_offering: boarding, status: "accepted",
      requested_starts_at: night2.starts_at, requested_ends_at: night2.ends_at
    )
    create(:booking_allocation, booking: other_customer_booking, availability_slot: night2)

    booking = business.bookings.create!(
      customer: customer, service_offering: boarding,
      requested_starts_at: night1.starts_at, requested_ends_at: night2.ends_at
    )
    booking.booking_pets.create!(pet: pet)

    result = described_class.new(booking: booking).call

    expect(result).not_to be_success
    expect(result.error_code).to eq("availability_conflict")
    expect(BookingAllocation.where(booking: booking)).to be_none
  end

  it "returns a conflict when capacity is already exhausted" do
    slot = create(:availability_slot, service_offering: offering, business: business,
                                       starts_at: 1.day.from_now, ends_at: 2.days.from_now, capacity: 1)
    already_accepted = make_booking(starts_at: slot.starts_at, ends_at: slot.ends_at)
    already_accepted.update!(status: :accepted)
    create(:booking_allocation, booking: already_accepted, availability_slot: slot)

    booking = make_booking(starts_at: slot.starts_at, ends_at: slot.ends_at)
    result = described_class.new(booking: booking).call

    expect(result).not_to be_success
    expect(result.error_code).to eq("availability_conflict")
  end

  it "rejects accepting an already-decided booking predictably" do
    slot = create(:availability_slot, service_offering: offering, business: business,
                                       starts_at: 1.day.from_now, ends_at: 2.days.from_now, capacity: 1)
    booking = make_booking(starts_at: slot.starts_at, ends_at: slot.ends_at)
    booking.update!(status: :denied)

    result = described_class.new(booking: booking).call

    expect(result).not_to be_success
    expect(result.error_code).to eq("invalid_state_transition")
  end

  it "does not overbook the last available place under concurrent acceptance", :concurrency do
    slot = create(:availability_slot, service_offering: offering, business: business,
                                       starts_at: 1.day.from_now, ends_at: 2.days.from_now, capacity: 1)
    booking_a = make_booking(starts_at: slot.starts_at, ends_at: slot.ends_at)
    booking_b = make_booking(starts_at: slot.starts_at, ends_at: slot.ends_at)

    ActiveRecord::Base.connection_pool.disconnect!
    results = []
    mutex = Mutex.new
    started = 0

    [ booking_a, booking_b ].map do |booking|
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          mutex.synchronize { started += 1 }
          sleep 0.01 until started == 2

          result = described_class.new(booking: booking).call
          mutex.synchronize { results << result }
        end
      end
    end.each(&:join)

    successes = results.count(&:success?)
    conflicts = results.count { |r| !r.success? && r.error_code == "availability_conflict" }

    expect(successes).to eq(1)
    expect(conflicts).to eq(1)
    expect(BookingAllocation.where(availability_slot: slot).count).to eq(1)
  end
end
