module Api
  module V1
    module Businesses
      class AvailabilitySlotsController < Api::V1::TenantScopedController
        before_action :set_service_offering!

        def index
          authorize AvailabilitySlot, :index?

          slots = @service_offering.availability_slots.order(:starts_at)
          render json: slots.map { |slot| slot_json(slot) }
        end

        def show
          slot = @service_offering.availability_slots.find(params[:id])
          authorize slot
          render json: slot_json(slot)
        end

        def create
          slot = @service_offering.availability_slots.new(slot_params)
          slot.business = Current.business
          authorize slot

          if slot.save
            render json: slot_json(slot), status: :created
          else
            render_validation_error_for(slot)
          end
        end

        def update
          slot = @service_offering.availability_slots.find(params[:id])
          authorize slot

          if slot.update(slot_params)
            render json: slot_json(slot)
          else
            render_validation_error_for(slot)
          end
        end

        private

        def set_service_offering!
          @service_offering = Current.business.service_offerings.find(params[:service_offering_id])
        end

        def slot_params
          params.require(:availability_slot).permit(:starts_at, :ends_at, :capacity, :active)
        end

        def render_validation_error_for(record)
          render_error(
            status: :unprocessable_content,
            code: "validation_failed",
            message: "The request could not be processed.",
            details: record.errors.to_hash
          )
        end

        def slot_json(slot)
          {
            id: slot.id,
            starts_at: slot.starts_at,
            ends_at: slot.ends_at,
            capacity: slot.capacity,
            active: slot.active
          }
        end
      end
    end
  end
end
