require "rails_helper"

RSpec.describe "Api::V1::BusinessRegistrations", type: :request do
  def valid_params
    {
      business_registration: {
        business_name: "Paws & Play Daycare",
        business_slug: "paws-and-play",
        time_zone: "America/New_York",
        owner_email: "owner@pawsandplay.example.com",
        owner_password: "password123"
      }
    }
  end

  describe "POST /api/v1/business_registrations" do
    it "creates a business, an owner user, an owner membership, and default services" do
      expect {
        post "/api/v1/business_registrations", params: valid_params
      }.to change(Business, :count).by(1)
        .and change(User, :count).by(1)
        .and change(Membership, :count).by(1)
        .and change(ServiceOffering, :count).by(3)

      expect(response).to have_http_status(:created)

      business = Business.find_by(slug: "paws-and-play")
      expect(business.memberships.first).to be_owner
      expect(business.service_offerings.pluck(:service_kind)).to contain_exactly("daycare", "training", "boarding")
    end

    it "logs the new owner in immediately" do
      post "/api/v1/business_registrations", params: valid_params

      user = User.find_by(email: "owner@pawsandplay.example.com")
      expect(session[:user_id]).to eq(user.id)
    end

    it "persists nothing if the owner's email is already taken" do
      create(:user, email: "owner@pawsandplay.example.com")

      expect {
        post "/api/v1/business_registrations", params: valid_params
      }.not_to change(Business, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body.dig("error", "code")).to eq("validation_failed")
    end

    it "persists nothing if the business slug is already taken" do
      create(:business, slug: "paws-and-play")

      expect {
        post "/api/v1/business_registrations", params: valid_params
      }.to change(User, :count).by(0).and change(ServiceOffering, :count).by(0)

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "rejects an invalid time zone" do
      params = valid_params
      params[:business_registration][:time_zone] = "Not/A_Zone"

      post "/api/v1/business_registrations", params: params

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body.dig("error", "details", "time_zone")).to be_present
    end
  end
end
