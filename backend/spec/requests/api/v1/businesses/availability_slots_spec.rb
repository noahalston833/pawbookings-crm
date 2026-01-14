require "rails_helper"

RSpec.describe "Api::V1::Businesses::AvailabilitySlots", type: :request do
  let!(:business) { create(:business, slug: "paws-and-play") }
  let!(:owner) { create(:user, password: "password123") }
  let!(:customer) { create(:user, password: "password123") }
  let!(:offering) { create(:service_offering, business: business) }

  before do
    create(:membership, :owner, business: business, user: owner)
    create(:membership, business: business, user: customer)
  end

  def login_as(user)
    post "/api/v1/session", params: { session: { email: user.email, password: "password123" } }
  end

  def slot_path(offering, extra = nil)
    base = "/api/v1/businesses/paws-and-play/service_offerings/#{offering.id}/availability_slots"
    extra ? "#{base}/#{extra}" : base
  end

  describe "POST .../availability_slots" do
    it "lets the owner create a slot" do
      login_as(owner)
      post slot_path(offering), params: {
        availability_slot: { starts_at: 1.day.from_now, ends_at: 2.days.from_now, capacity: 5 }
      }

      expect(response).to have_http_status(:created)
    end

    it "forbids a customer from creating a slot" do
      login_as(customer)
      post slot_path(offering), params: {
        availability_slot: { starts_at: 1.day.from_now, ends_at: 2.days.from_now, capacity: 5 }
      }

      expect(response).to have_http_status(:forbidden)
    end

    it "rejects an end time before the start time" do
      login_as(owner)
      post slot_path(offering), params: {
        availability_slot: { starts_at: 2.days.from_now, ends_at: 1.day.from_now, capacity: 5 }
      }

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "returns 404 for a service offering that belongs to another business" do
      other_business = create(:business, slug: "city-tails")
      other_offering = create(:service_offering, business: other_business)
      login_as(owner)

      post slot_path(other_offering), params: {
        availability_slot: { starts_at: 1.day.from_now, ends_at: 2.days.from_now, capacity: 5 }
      }

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET .../availability_slots" do
    it "lets a customer view slots" do
      create(:availability_slot, service_offering: offering, business: business)
      login_as(customer)

      get slot_path(offering)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.size).to eq(1)
    end
  end
end
