require "rails_helper"

RSpec.describe "Api::V1::Businesses::CustomerRegistrations", type: :request do
  let!(:business) { create(:business, slug: "paws-and-play") }

  describe "POST /api/v1/businesses/:business_slug/customer_registration" do
    it "registers a brand-new user and logs them in" do
      expect {
        post "/api/v1/businesses/paws-and-play/customer_registration",
             params: { customer_registration: { email: "new-customer@example.com", password: "password123" } }
      }.to change(User, :count).by(1).and change(Membership, :count).by(1)

      expect(response).to have_http_status(:created)
      membership = Membership.last
      expect(membership).to be_customer
      expect(session[:user_id]).to eq(membership.user_id)
    end

    it "refuses to attach an existing email without authentication" do
      create(:user, email: "existing@example.com")

      expect {
        post "/api/v1/businesses/paws-and-play/customer_registration",
             params: { customer_registration: { email: "existing@example.com", password: "password123" } }
      }.not_to change(Membership, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body.dig("error", "code")).to eq("email_already_registered")
    end

    it "lets an already-authenticated user join a new business" do
      user = create(:user, email: "existing@example.com", password: "password123")
      post "/api/v1/session", params: { session: { email: "existing@example.com", password: "password123" } }

      expect {
        post "/api/v1/businesses/paws-and-play/customer_registration",
             params: { customer_registration: { email: "existing@example.com", password: "password123" } }
      }.to change(Membership, :count).by(1).and change(User, :count).by(0)

      expect(response).to have_http_status(:created)
      expect(user.memberships.reload.first.business).to eq(business)
    end

    it "rejects joining a business the user already belongs to" do
      user = create(:user, email: "existing@example.com", password: "password123")
      create(:membership, :customer, business: business, user: user)
      post "/api/v1/session", params: { session: { email: "existing@example.com", password: "password123" } }

      post "/api/v1/businesses/paws-and-play/customer_registration",
           params: { customer_registration: { email: "existing@example.com", password: "password123" } }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body.dig("error", "code")).to eq("already_a_member")
    end

    it "returns 404 for an unknown business slug" do
      post "/api/v1/businesses/does-not-exist/customer_registration",
           params: { customer_registration: { email: "new@example.com", password: "password123" } }

      expect(response).to have_http_status(:not_found)
    end
  end
end
