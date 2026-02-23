module Api
  module V1
    module Businesses
      class BusinessSettingsController < Api::V1::TenantScopedController
        def show
          authorize Current.business, :show_settings?
          render json: business_json(Current.business)
        end

        def update
          business = Current.business
          authorize business, :update_settings?

          before = business.attributes.slice("name", "time_zone", "settings")

          if business.update(business_params)
            AuditEvent.record!(
              business: business, actor: current_user, action: "business.settings_changed",
              target: business, metadata: { before: before, after: business.attributes.slice("name", "time_zone", "settings") }
            )
            render json: business_json(business)
          else
            render_error(
              status: :unprocessable_content,
              code: "validation_failed",
              message: "The request could not be processed.",
              details: business.errors.to_hash
            )
          end
        end

        private

        def business_params
          params.require(:business).permit(:name, :time_zone, settings: {})
        end

        def business_json(business)
          {
            id: business.id,
            name: business.name,
            slug: business.slug,
            time_zone: business.time_zone,
            settings: business.settings
          }
        end
      end
    end
  end
end
