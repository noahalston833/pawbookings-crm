require "rails_helper"

RSpec.describe "Api::V1::Businesses::Memberships", type: :request do
  let!(:business) { create(:business, slug: "paws-and-play") }
  let!(:other_business) { create(:business, slug: "city-tails") }

  let!(:owner) { create(:user, password: "password123") }
  let!(:admin) { create(:user, password: "password123") }
  let!(:staff) { create(:user, password: "password123") }
  let!(:customer) { create(:user, password: "password123") }

  let!(:owner_membership) { create(:membership, :owner, business: business, user: owner) }
  let!(:admin_membership) { create(:membership, :admin, business: business, user: admin) }
  let!(:staff_membership) { create(:membership, :staff, business: business, user: staff) }
  let!(:customer_membership) { create(:membership, business: business, user: customer) }

  def login_as(user)
    post "/api/v1/session", params: { session: { email: user.email, password: "password123" } }
  end

  describe "GET /api/v1/businesses/:business_slug/memberships" do
    it "allows the owner to list memberships" do
      login_as(owner)
      get "/api/v1/businesses/paws-and-play/memberships"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.size).to eq(4)
    end

    it "allows an admin to list memberships" do
      login_as(admin)
      get "/api/v1/businesses/paws-and-play/memberships"

      expect(response).to have_http_status(:ok)
    end

    it "forbids staff from listing memberships" do
      login_as(staff)
      get "/api/v1/businesses/paws-and-play/memberships"

      expect(response).to have_http_status(:forbidden)
    end

    it "forbids a customer from listing memberships" do
      login_as(customer)
      get "/api/v1/businesses/paws-and-play/memberships"

      expect(response).to have_http_status(:forbidden)
    end

    it "requires authentication" do
      get "/api/v1/businesses/paws-and-play/memberships"

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 404, not 403, for a user with no membership in that business" do
      outsider = create(:user, password: "password123")
      login_as(outsider)

      get "/api/v1/businesses/paws-and-play/memberships"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "PATCH /api/v1/businesses/:business_slug/memberships/:id" do
    it "lets the owner change any role, including granting owner" do
      login_as(owner)
      patch "/api/v1/businesses/paws-and-play/memberships/#{staff_membership.id}",
            params: { membership: { role: "admin" } }

      expect(response).to have_http_status(:ok)
      expect(staff_membership.reload.role).to eq("admin")

      event = AuditEvent.last
      expect(event.action).to eq("membership.role_changed")
      expect(event.metadata).to include("from" => "staff", "to" => "admin")
    end

    it "lets an admin change a customer's role to staff" do
      login_as(admin)
      patch "/api/v1/businesses/paws-and-play/memberships/#{customer_membership.id}",
            params: { membership: { role: "staff" } }

      expect(response).to have_http_status(:ok)
    end

    it "forbids an admin from granting owner" do
      login_as(admin)
      patch "/api/v1/businesses/paws-and-play/memberships/#{staff_membership.id}",
            params: { membership: { role: "owner" } }

      expect(response).to have_http_status(:forbidden)
      expect(staff_membership.reload.role).to eq("staff")
    end

    it "forbids an admin from changing the owner's role" do
      login_as(admin)
      patch "/api/v1/businesses/paws-and-play/memberships/#{owner_membership.id}",
            params: { membership: { role: "staff" } }

      expect(response).to have_http_status(:forbidden)
    end

    it "forbids staff from changing any role" do
      login_as(staff)
      patch "/api/v1/businesses/paws-and-play/memberships/#{customer_membership.id}",
            params: { membership: { role: "admin" } }

      expect(response).to have_http_status(:forbidden)
    end

    it "does not leak a Business B membership id into Business A's scope" do
      outsider_membership = create(:membership, business: other_business)
      login_as(owner)

      patch "/api/v1/businesses/paws-and-play/memberships/#{outsider_membership.id}",
            params: { membership: { role: "admin" } }

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "DELETE /api/v1/businesses/:business_slug/memberships/:id" do
    it "lets the owner remove a staff membership" do
      login_as(owner)
      delete "/api/v1/businesses/paws-and-play/memberships/#{staff_membership.id}"

      expect(response).to have_http_status(:no_content)
    end

    it "forbids an admin from removing the owner" do
      login_as(admin)
      delete "/api/v1/businesses/paws-and-play/memberships/#{owner_membership.id}"

      expect(response).to have_http_status(:forbidden)
    end

    it "prevents removing the business's last owner even via the owner's own request" do
      login_as(owner)
      delete "/api/v1/businesses/paws-and-play/memberships/#{owner_membership.id}"

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "forbids a customer from removing any membership" do
      login_as(customer)
      delete "/api/v1/businesses/paws-and-play/memberships/#{staff_membership.id}"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
