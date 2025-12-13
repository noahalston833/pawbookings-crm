module Api
  module V1
    # The frontend fetches a token here once, then sends it back as
    # X-CSRF-Token on mutating requests -- Rails' CSRF protection doesn't
    # ship a token-delivery endpoint for API-only apps, since it normally
    # assumes a server-rendered <meta> tag instead.
    class CsrfTokensController < BaseController
      # form_authenticity_token requires a session to bind the token to;
      # skip_before_action isn't needed since GET isn't forgery-protected.
      def show
        render json: { csrf_token: form_authenticity_token }
      end
    end
  end
end
