require "rails_helper"

RSpec.describe "Api::V1::Businesses", type: :request do
  describe "GET /api/v1/businesses/:slug" do
    it "returns public, non-sensitive business info without requiring authentication" do
      create(:business, slug: "paws-and-play", name: "Paws & Play Daycare", time_zone: "America/New_York")

      get "/api/v1/businesses/paws-and-play"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq(
        "slug" => "paws-and-play", "name" => "Paws & Play Daycare", "time_zone" => "America/New_York"
      )
    end

    it "returns 404 for an unknown slug" do
      get "/api/v1/businesses/does-not-exist"

      expect(response).to have_http_status(:not_found)
    end
  end
end
