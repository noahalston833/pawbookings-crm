require "rails_helper"

RSpec.describe "Api::V1::Businesses::BusinessSettings", type: :request do
  let!(:business) { create(:business, slug: "paws-and-play", name: "Paws & Play") }
  let!(:owner) { create(:user, password: "password123") }
  let!(:admin) { create(:user, password: "password123") }

  before do
    create(:membership, :owner, business: business, user: owner)
    create(:membership, :admin, business: business, user: admin)
  end

  def login_as(user)
    post "/api/v1/session", params: { session: { email: user.email, password: "password123" } }
  end

  it "lets the owner update business settings and records an audit event" do
    login_as(owner)

    patch "/api/v1/businesses/paws-and-play/business_settings", params: { business: { name: "Paws & Play Daycare" } }

    expect(response).to have_http_status(:ok)
    expect(business.reload.name).to eq("Paws & Play Daycare")
    expect(AuditEvent.last.action).to eq("business.settings_changed")
  end

  it "forbids an admin from updating business settings" do
    login_as(admin)

    patch "/api/v1/businesses/paws-and-play/business_settings", params: { business: { name: "Hacked" } }

    expect(response).to have_http_status(:forbidden)
    expect(business.reload.name).to eq("Paws & Play")
  end

  it "allows an admin to view business settings" do
    login_as(admin)

    get "/api/v1/businesses/paws-and-play/business_settings"

    expect(response).to have_http_status(:ok)
  end
end
