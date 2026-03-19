module Api
  module V1
    # Deliberately public and unauthenticated: just enough non-sensitive
    # info (name/time zone) for a tenant-specific signup page to render
    # something better than a raw slug before the visitor has an account.
    class BusinessesController < BaseController
      def show
        business = Business.find_by!(slug: params[:slug])
        render json: { slug: business.slug, name: business.name, time_zone: business.time_zone }
      end
    end
  end
end
