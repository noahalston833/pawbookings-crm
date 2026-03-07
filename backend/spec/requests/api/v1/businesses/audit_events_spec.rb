require "rails_helper"

RSpec.describe "Api::V1::Businesses::AuditEvents", type: :request do
  let!(:business) { create(:business, slug: "paws-and-play") }
  let!(:owner) { create(:user, password: "password123") }
  let!(:customer) { create(:user, password: "password123") }

  before do
    create(:membership, :owner, business: business, user: owner)
    create(:membership, business: business, user: customer)
    create_list(:audit_event, 3, business: business, actor: owner)
  end

  def login_as(user)
    post "/api/v1/session", params: { session: { email: user.email, password: "password123" } }
  end

  it "lets the owner view the audit history" do
    login_as(owner)

    get "/api/v1/businesses/paws-and-play/audit_events"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.size).to eq(3)
  end

  it "forbids a customer from viewing the audit history" do
    login_as(customer)

    get "/api/v1/businesses/paws-and-play/audit_events"

    expect(response).to have_http_status(:forbidden)
  end

  it "paginates using page and per_page" do
    login_as(owner)

    get "/api/v1/businesses/paws-and-play/audit_events", params: { per_page: 2, page: 1 }
    expect(response.parsed_body.size).to eq(2)

    get "/api/v1/businesses/paws-and-play/audit_events", params: { per_page: 2, page: 2 }
    expect(response.parsed_body.size).to eq(1)
  end
end
