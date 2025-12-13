module Api
  module V1
    # Business-account signup: creates a business, its owner user, and the
    # owner membership together (see app/services/business_signup.rb).
    class BusinessRegistrationsController < BaseController
      def create
        result = BusinessSignup.new(
          business_name: registration_params[:business_name],
          business_slug: registration_params[:business_slug],
          time_zone: registration_params[:time_zone],
          owner_email: registration_params[:owner_email],
          owner_password: registration_params[:owner_password]
        ).call

        if result.success?
          session[:user_id] = result.user.id
          render json: {
            business: business_json(result.business),
            user: { id: result.user.id, email: result.user.email }
          }, status: :created
        else
          render_error(
            status: :unprocessable_content,
            code: "validation_failed",
            message: "The request could not be processed.",
            details: result.errors.to_hash
          )
        end
      end

      private

      def registration_params
        params.require(:business_registration).permit(
          :business_name, :business_slug, :time_zone, :owner_email, :owner_password
        )
      end

      def business_json(business)
        { id: business.id, name: business.name, slug: business.slug, time_zone: business.time_zone }
      end
    end
  end
end
