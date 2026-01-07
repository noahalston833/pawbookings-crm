module Api
  module V1
    module Businesses
      class ServiceOfferingsController < Api::V1::TenantScopedController
        def index
          authorize ServiceOffering, :index?

          offerings = Current.business.service_offerings.order(:id)
          render json: offerings.map { |offering| service_offering_json(offering) }
        end

        def show
          offering = Current.business.service_offerings.find(params[:id])
          authorize offering
          render json: service_offering_json(offering)
        end

        def create
          offering = Current.business.service_offerings.new(service_offering_params)
          authorize offering

          if offering.save
            render json: service_offering_json(offering), status: :created
          else
            render_validation_error_for(offering)
          end
        end

        def update
          offering = Current.business.service_offerings.find(params[:id])
          authorize offering

          if offering.update(service_offering_params)
            render json: service_offering_json(offering)
          else
            render_validation_error_for(offering)
          end
        end

        private

        def service_offering_params
          params.require(:service_offering).permit(
            :name, :service_kind, :description, :active,
            :default_capacity, :default_duration_minutes, :customer_facing_instructions
          )
        end

        def render_validation_error_for(record)
          render_error(
            status: :unprocessable_content,
            code: "validation_failed",
            message: "The request could not be processed.",
            details: record.errors.to_hash
          )
        end

        def service_offering_json(offering)
          {
            id: offering.id,
            name: offering.name,
            service_kind: offering.service_kind,
            description: offering.description,
            active: offering.active,
            default_capacity: offering.default_capacity,
            default_duration_minutes: offering.default_duration_minutes,
            customer_facing_instructions: offering.customer_facing_instructions
          }
        end
      end
    end
  end
end
