require "rails_helper"

RSpec.describe "Api::V1::Businesses::ServiceOfferings", type: :request do
  let!(:business) { create(:business, slug: "paws-and-play") }
  let!(:other_business) { create(:business, slug: "city-tails") }
  let!(:owner) { create(:user, password: "password123") }
  let!(:customer) { create(:user, password: "password123") }

  before do
    create(:membership, :owner, business: business, user: owner)
    create(:membership, business: business, user: customer)
  end

  let!(:offering) { create(:service_offering, business: business) }

  def login_as(user)
    post "/api/v1/session", params: { session: { email: user.email, password: "password123" } }
  end

  describe "GET /api/v1/businesses/:business_slug/service_offerings" do
    it "allows a customer to view the business's services" do
      login_as(customer)
      get "/api/v1/businesses/paws-and-play/service_offerings"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.size).to eq(1)
    end
  end

  describe "POST /api/v1/businesses/:business_slug/service_offerings" do
    it "lets the owner create a service" do
      login_as(owner)
      post "/api/v1/businesses/paws-and-play/service_offerings",
           params: { service_offering: { name: "Training", service_kind: "training", default_capacity: 1 } }

      expect(response).to have_http_status(:created)
    end

    it "forbids a customer from creating a service" do
      login_as(customer)
      post "/api/v1/businesses/paws-and-play/service_offerings",
           params: { service_offering: { name: "Training", service_kind: "training", default_capacity: 1 } }

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 404 for a service offering id from a different business" do
      outsider_offering = create(:service_offering, business: other_business)
      login_as(owner)

      get "/api/v1/businesses/paws-and-play/service_offerings/#{outsider_offering.id}"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "PATCH /api/v1/businesses/:business_slug/service_offerings/:id" do
    it "lets an owner deactivate a service" do
      login_as(owner)
      patch "/api/v1/businesses/paws-and-play/service_offerings/#{offering.id}",
            params: { service_offering: { active: false } }

      expect(response).to have_http_status(:ok)
      expect(offering.reload.active).to be(false)
    end
  end
end
