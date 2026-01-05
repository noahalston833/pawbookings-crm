require "rails_helper"

RSpec.describe "Api::V1::Businesses::Pets", type: :request do
  let!(:business) { create(:business, slug: "paws-and-play") }
  let!(:other_business) { create(:business, slug: "city-tails") }

  let!(:owner) { create(:user, password: "password123") }
  let!(:staff) { create(:user, password: "password123") }
  let!(:customer_a) { create(:user, password: "password123") }
  let!(:customer_b) { create(:user, password: "password123") }

  before do
    create(:membership, :owner, business: business, user: owner)
    create(:membership, :staff, business: business, user: staff)
    create(:membership, business: business, user: customer_a)
    create(:membership, business: business, user: customer_b)
  end

  let!(:pet_a) { create(:pet, business: business, user: customer_a, name: "Rex") }
  let!(:pet_b) { create(:pet, business: business, user: customer_b, name: "Fido") }

  def login_as(user)
    post "/api/v1/session", params: { session: { email: user.email, password: "password123" } }
  end

  def pet_params(overrides = {})
    {
      pet: {
        name: "Buddy", species: "dog", breed: "Beagle", sex: "male",
        birth_date: 1.year.ago.to_date, weight: 12.3
      }.merge(overrides)
    }
  end

  describe "GET /api/v1/businesses/:business_slug/pets" do
    it "shows staff every pet in the business" do
      login_as(staff)
      get "/api/v1/businesses/paws-and-play/pets"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.size).to eq(2)
    end

    it "shows a customer only their own pets" do
      login_as(customer_a)
      get "/api/v1/businesses/paws-and-play/pets"

      expect(response).to have_http_status(:ok)
      names = response.parsed_body.pluck("name")
      expect(names).to eq([ "Rex" ])
    end
  end

  describe "GET /api/v1/businesses/:business_slug/pets/:id" do
    it "forbids a customer from viewing another customer's pet" do
      login_as(customer_b)
      get "/api/v1/businesses/paws-and-play/pets/#{pet_a.id}"

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 404 for a pet belonging to a different business" do
      outsider_pet = create(:pet, business: other_business)
      login_as(owner)

      get "/api/v1/businesses/paws-and-play/pets/#{outsider_pet.id}"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/businesses/:business_slug/pets" do
    it "lets a customer create a pet for themselves" do
      login_as(customer_a)

      expect {
        post "/api/v1/businesses/paws-and-play/pets", params: pet_params
      }.to change(Pet, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(Pet.last.user).to eq(customer_a)
    end

    it "forbids staff from creating a pet" do
      login_as(staff)
      post "/api/v1/businesses/paws-and-play/pets", params: pet_params

      expect(response).to have_http_status(:forbidden)
    end

    it "rejects a non-dog species" do
      login_as(customer_a)
      post "/api/v1/businesses/paws-and-play/pets", params: pet_params(species: "cat")

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "PATCH /api/v1/businesses/:business_slug/pets/:id" do
    it "lets a customer archive their own pet" do
      login_as(customer_a)
      patch "/api/v1/businesses/paws-and-play/pets/#{pet_a.id}", params: { pet: { status: "archived" } }

      expect(response).to have_http_status(:ok)
      expect(pet_a.reload.status).to eq("archived")
    end

    it "forbids a customer from updating another customer's pet" do
      login_as(customer_a)
      patch "/api/v1/businesses/paws-and-play/pets/#{pet_b.id}", params: { pet: { name: "Hacked" } }

      expect(response).to have_http_status(:forbidden)
      expect(pet_b.reload.name).to eq("Fido")
    end

    it "lets the owner update any pet in the business" do
      login_as(owner)
      patch "/api/v1/businesses/paws-and-play/pets/#{pet_a.id}", params: { pet: { breed: "Mixed" } }

      expect(response).to have_http_status(:ok)
    end

    it "forbids staff from updating a pet" do
      login_as(staff)
      patch "/api/v1/businesses/paws-and-play/pets/#{pet_a.id}", params: { pet: { name: "Hacked" } }

      expect(response).to have_http_status(:forbidden)
    end
  end
end
