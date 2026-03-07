require "rails_helper"

RSpec.describe "Api::V1::Businesses::Bookings", type: :request do
  let!(:business) { create(:business, slug: "paws-and-play") }
  let!(:offering) { create(:service_offering, business: business) }
  let!(:customer) { create(:user, password: "password123") }
  let!(:staff) { create(:user, password: "password123") }
  let!(:owner) { create(:user, password: "password123") }
  let!(:pet) { create(:pet, business: business, user: customer) }

  before do
    create(:membership, business: business, user: customer)
    create(:membership, :staff, business: business, user: staff)
    create(:membership, :owner, business: business, user: owner)
  end

  def login_as(user)
    post "/api/v1/session", params: { session: { email: user.email, password: "password123" } }
  end

  def booking_params(overrides = {})
    {
      booking: {
        service_offering_id: offering.id,
        pet_ids: [ pet.id ],
        requested_starts_at: 1.day.from_now.iso8601,
        requested_ends_at: 2.days.from_now.iso8601,
        notes: "First time visit"
      }.merge(overrides)
    }
  end

  describe "POST /api/v1/businesses/:business_slug/bookings" do
    it "requires an Idempotency-Key header" do
      login_as(customer)
      post "/api/v1/businesses/paws-and-play/bookings", params: booking_params

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body.dig("error", "code")).to eq("missing_idempotency_key")
    end

    it "creates a pending booking" do
      login_as(customer)

      expect {
        post "/api/v1/businesses/paws-and-play/bookings",
             params: booking_params,
             headers: { "Idempotency-Key" => "req-1" }
      }.to change(Booking, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["status"]).to eq("pending")
    end

    it "replays the same response for a retried key with the same payload" do
      login_as(customer)
      params = booking_params

      post "/api/v1/businesses/paws-and-play/bookings", params: params, headers: { "Idempotency-Key" => "req-2" }
      first_body = response.parsed_body

      expect {
        post "/api/v1/businesses/paws-and-play/bookings", params: params, headers: { "Idempotency-Key" => "req-2" }
      }.not_to change(Booking, :count)

      expect(response.parsed_body).to eq(first_body)
    end

    it "rejects a reused key with a different payload" do
      login_as(customer)
      post "/api/v1/businesses/paws-and-play/bookings",
           params: booking_params,
           headers: { "Idempotency-Key" => "req-3" }

      post "/api/v1/businesses/paws-and-play/bookings",
           params: booking_params(notes: "different notes"),
           headers: { "Idempotency-Key" => "req-3" }

      expect(response).to have_http_status(:conflict)
      expect(response.parsed_body.dig("error", "code")).to eq("idempotency_key_conflict")
    end

    it "forbids staff from creating a booking request" do
      login_as(staff)
      post "/api/v1/businesses/paws-and-play/bookings",
           params: booking_params,
           headers: { "Idempotency-Key" => "req-4" }

      expect(response).to have_http_status(:forbidden)
    end

    it "rejects booking someone else's pet and does not cache the failure as a success" do
      other_pet = create(:pet, business: business)
      login_as(customer)

      post "/api/v1/businesses/paws-and-play/bookings",
           params: booking_params(pet_ids: [ other_pet.id ]),
           headers: { "Idempotency-Key" => "req-5" }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body.dig("error", "code")).to eq("validation_failed")
    end
  end

  describe "GET /api/v1/businesses/:business_slug/bookings" do
    it "shows staff every booking; shows a customer only their own" do
      login_as(customer)
      post "/api/v1/businesses/paws-and-play/bookings", params: booking_params, headers: { "Idempotency-Key" => "req-6" }

      login_as(staff)
      get "/api/v1/businesses/paws-and-play/bookings"
      expect(response.parsed_body.size).to eq(1)

      other_customer = create(:user, password: "password123")
      create(:membership, business: business, user: other_customer)
      login_as(other_customer)
      get "/api/v1/businesses/paws-and-play/bookings"
      expect(response.parsed_body).to be_empty
    end
  end

  describe "POST .../bookings/:id/accept" do
    let!(:slot) do
      create(:availability_slot, service_offering: offering, business: business,
                                  starts_at: 1.day.from_now.beginning_of_day + 9.hours,
                                  ends_at: 1.day.from_now.beginning_of_day + 17.hours, capacity: 1)
    end

    def create_pending_booking
      login_as(customer)
      post "/api/v1/businesses/paws-and-play/bookings",
           params: booking_params(requested_starts_at: slot.starts_at.iso8601, requested_ends_at: slot.ends_at.iso8601),
           headers: { "Idempotency-Key" => SecureRandom.hex(4) }
      Booking.find(response.parsed_body["id"])
    end

    it "lets the owner accept a pending booking and creates an allocation" do
      booking = create_pending_booking
      login_as(owner)

      post "/api/v1/businesses/paws-and-play/bookings/#{booking.id}/accept",
           headers: { "Idempotency-Key" => "accept-1" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("accepted")
      expect(booking.reload.booking_allocations.count).to eq(1)
    end

    it "records an audit event and enqueues a notification job" do
      booking = create_pending_booking
      login_as(owner)

      expect {
        post "/api/v1/businesses/paws-and-play/bookings/#{booking.id}/accept",
             headers: { "Idempotency-Key" => "accept-audit" }
      }.to have_enqueued_job(BookingAcceptedNotificationJob).with(business_id: business.id, booking_id: booking.id)

      event = AuditEvent.last
      expect(event.action).to eq("booking.accepted")
      expect(event.actor).to eq(owner)
      expect(event.target).to eq(booking)
    end

    it "returns a 409 availability conflict when capacity is gone" do
      first_booking = create_pending_booking
      login_as(owner)
      post "/api/v1/businesses/paws-and-play/bookings/#{first_booking.id}/accept",
           headers: { "Idempotency-Key" => "accept-2" }

      second_booking = create_pending_booking
      login_as(owner)
      post "/api/v1/businesses/paws-and-play/bookings/#{second_booking.id}/accept",
           headers: { "Idempotency-Key" => "accept-3" }

      expect(response).to have_http_status(:conflict)
      expect(response.parsed_body.dig("error", "code")).to eq("availability_conflict")
    end

    it "forbids a customer from accepting their own booking" do
      booking = create_pending_booking
      login_as(customer)

      post "/api/v1/businesses/paws-and-play/bookings/#{booking.id}/accept",
           headers: { "Idempotency-Key" => "accept-4" }

      expect(response).to have_http_status(:forbidden)
    end

    it "requires an Idempotency-Key" do
      booking = create_pending_booking
      login_as(owner)

      post "/api/v1/businesses/paws-and-play/bookings/#{booking.id}/accept"

      expect(response).to have_http_status(:bad_request)
    end

    it "is safe and predictable on a repeat accept of an already-accepted booking" do
      booking = create_pending_booking
      login_as(owner)
      post "/api/v1/businesses/paws-and-play/bookings/#{booking.id}/accept",
           headers: { "Idempotency-Key" => "accept-5" }

      post "/api/v1/businesses/paws-and-play/bookings/#{booking.id}/accept",
           headers: { "Idempotency-Key" => "accept-6" }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body.dig("error", "code")).to eq("invalid_state_transition")
    end
  end

  describe "POST .../bookings/:id/deny" do
    it "lets an admin deny a pending booking with a reason" do
      admin = create(:user, password: "password123")
      create(:membership, :admin, business: business, user: admin)
      login_as(customer)
      post "/api/v1/businesses/paws-and-play/bookings", params: booking_params, headers: { "Idempotency-Key" => "deny-key" }
      booking = Booking.find(response.parsed_body["id"])

      login_as(admin)
      post "/api/v1/businesses/paws-and-play/bookings/#{booking.id}/deny",
           params: { booking: { reason: "No availability this week" } },
           headers: { "Idempotency-Key" => "deny-1" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["denial_reason"]).to eq("No availability this week")
    end
  end

  describe "POST .../bookings/:id/cancel" do
    it "lets a customer cancel their own pending booking" do
      login_as(customer)
      post "/api/v1/businesses/paws-and-play/bookings", params: booking_params, headers: { "Idempotency-Key" => "cancel-key" }
      booking = Booking.find(response.parsed_body["id"])

      post "/api/v1/businesses/paws-and-play/bookings/#{booking.id}/cancel",
           headers: { "Idempotency-Key" => "cancel-1" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("cancelled")
    end

    it "forbids a customer from cancelling another customer's booking" do
      other_customer = create(:user, password: "password123")
      create(:membership, business: business, user: other_customer)
      login_as(customer)
      post "/api/v1/businesses/paws-and-play/bookings", params: booking_params, headers: { "Idempotency-Key" => "cancel-key-2" }
      booking = Booking.find(response.parsed_body["id"])

      login_as(other_customer)
      post "/api/v1/businesses/paws-and-play/bookings/#{booking.id}/cancel",
           headers: { "Idempotency-Key" => "cancel-2" }

      expect(response).to have_http_status(:forbidden)
    end
  end
end
