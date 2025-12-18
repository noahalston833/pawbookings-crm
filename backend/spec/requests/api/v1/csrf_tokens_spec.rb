require "rails_helper"

RSpec.describe "Api::V1::CsrfTokens", type: :request do
  it "returns a token the frontend can echo back as X-CSRF-Token" do
    get "/api/v1/csrf_token"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["csrf_token"]).to be_present
  end
end
