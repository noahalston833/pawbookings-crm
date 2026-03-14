require "rails_helper"

RSpec.describe "Api::V1::Sessions", type: :request do
  let!(:user) { create(:user, email: "customer@example.com", password: "password123") }

  describe "GET /api/v1/session" do
    it "returns the current user when logged in" do
      post "/api/v1/session", params: { session: { email: "customer@example.com", password: "password123" } }

      get "/api/v1/session"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["user"]).to include("id" => user.id)
    end

    it "returns 401 when not logged in" do
      get "/api/v1/session"

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/v1/session" do
    it "logs in with correct credentials and returns the user" do
      post "/api/v1/session", params: { session: { email: "customer@example.com", password: "password123" } }

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["user"]).to include("id" => user.id, "email" => user.email)
    end

    it "normalizes email the same way registration does" do
      post "/api/v1/session", params: { session: { email: "  Customer@Example.com  ", password: "password123" } }

      expect(response).to have_http_status(:ok)
    end

    it "rejects an incorrect password without revealing whether the email exists" do
      post "/api/v1/session", params: { session: { email: "customer@example.com", password: "wrong" } }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body.dig("error", "code")).to eq("invalid_credentials")
    end

    it "rejects an unknown email with the same error as a wrong password" do
      post "/api/v1/session", params: { session: { email: "nobody@example.com", password: "password123" } }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body.dig("error", "code")).to eq("invalid_credentials")
    end

    it "rate limits repeated failed attempts from the same IP" do
      11.times do
        post "/api/v1/session", params: { session: { email: "customer@example.com", password: "wrong" } }
      end

      expect(response).to have_http_status(:too_many_requests)
      expect(response.parsed_body.dig("error", "code")).to eq("rate_limited")
    end

    it "rejects a request with an invalid CSRF token when forgery protection is enabled" do
      original = ApplicationController.allow_forgery_protection
      ApplicationController.allow_forgery_protection = true

      post "/api/v1/session",
           params: { session: { email: "customer@example.com", password: "password123" } },
           headers: { "X-CSRF-Token" => "not-a-real-token" }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body.dig("error", "code")).to eq("invalid_csrf_token")
    ensure
      ApplicationController.allow_forgery_protection = original
    end
  end

  describe "DELETE /api/v1/session" do
    it "logs out and clears the session" do
      post "/api/v1/session", params: { session: { email: "customer@example.com", password: "password123" } }

      delete "/api/v1/session"

      expect(response).to have_http_status(:no_content)
    end
  end
end
