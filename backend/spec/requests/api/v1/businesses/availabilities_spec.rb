require "rails_helper"

RSpec.describe "Api::V1::Businesses::Availabilities", type: :request do
  let!(:business) { create(:business, slug: "paws-and-play", time_zone: "America/New_York") }
  let!(:customer) { create(:user, password: "password123") }
  let!(:offering) { create(:service_offering, business: business) }

  before { create(:membership, business: business, user: customer) }

  def login_as(user)
    post "/api/v1/session", params: { session: { email: user.email, password: "password123" } }
  end

  def availability_path(offering, params = {})
    "/api/v1/businesses/paws-and-play/service_offerings/#{offering.id}/availability?#{params.to_query}"
  end

  it "returns future active slots with remaining capacity and the business time zone" do
    slot = create(:availability_slot, service_offering: offering, business: business,
                                       starts_at: 1.day.from_now, ends_at: 2.days.from_now, capacity: 7)
    login_as(customer)

    get availability_path(offering)

    expect(response).to have_http_status(:ok)
    body = response.parsed_body
    expect(body["time_zone"]).to eq("America/New_York")
    expect(body["slots"].size).to eq(1)
    expect(body["slots"].first).to include("id" => slot.id, "capacity" => 7, "remaining_capacity" => 7)
  end

  it "subtracts accepted bookings' allocations from remaining capacity, but not pending ones" do
    slot = create(:availability_slot, service_offering: offering, business: business,
                                       starts_at: 1.day.from_now, ends_at: 2.days.from_now, capacity: 2)
    accepted = create(:booking, :accepted, service_offering: offering, business: business,
                                            requested_starts_at: slot.starts_at, requested_ends_at: slot.ends_at)
    create(:booking_allocation, booking: accepted, availability_slot: slot)
    create(:booking, service_offering: offering, business: business,
                      requested_starts_at: slot.starts_at, requested_ends_at: slot.ends_at) # pending, no allocation
    login_as(customer)

    get availability_path(offering)

    expect(response.parsed_body["slots"].first["remaining_capacity"]).to eq(1)
  end

  it "excludes inactive slots" do
    create(:availability_slot, service_offering: offering, business: business, active: false,
                                starts_at: 1.day.from_now, ends_at: 2.days.from_now)
    login_as(customer)

    get availability_path(offering)

    expect(response.parsed_body["slots"]).to be_empty
  end

  it "excludes slots outside the requested date range" do
    create(:availability_slot, service_offering: offering, business: business,
                                starts_at: 40.days.from_now, ends_at: 41.days.from_now)
    login_as(customer)

    get availability_path(offering, from: Date.current, to: 10.days.from_now.to_date)

    expect(response.parsed_body["slots"]).to be_empty
  end

  it "returns 404 for a service offering in a different business" do
    other_business = create(:business, slug: "city-tails")
    other_offering = create(:service_offering, business: other_business)
    login_as(customer)

    get "/api/v1/businesses/paws-and-play/service_offerings/#{other_offering.id}/availability"

    expect(response).to have_http_status(:not_found)
  end

  it "does not issue additional queries per slot (no N+1 as the slot count grows)" do
    3.times do |i|
      create(:availability_slot, service_offering: offering, business: business,
                                  starts_at: (i + 1).days.from_now, ends_at: (i + 2).days.from_now)
    end
    login_as(customer)

    query_count = lambda do
      count = 0
      counter = ->(*) { count += 1 }
      ActiveSupport::Notifications.subscribed(counter, "sql.active_record") do
        get availability_path(offering)
      end
      count
    end

    baseline = query_count.call
    5.times do |i|
      create(:availability_slot, service_offering: offering, business: business,
                                  starts_at: (i + 10).days.from_now, ends_at: (i + 11).days.from_now)
    end
    with_more_slots = query_count.call

    expect(with_more_slots).to eq(baseline)
  end
end
