module Api
  module V1
    module Businesses
      class BookingsController < Api::V1::TenantScopedController
        def index
          authorize Booking, :index?

          bookings = policy_scope(Current.business.bookings)
                     .includes(:service_offering, :customer, :pets)
                     .order(created_at: :desc)
          render json: bookings.map { |booking| booking_json(booking) }
        end

        def show
          booking = Current.business.bookings.includes(:service_offering, :customer, :pets).find(params[:id])
          authorize booking
          render json: booking_json(booking)
        end

        def create
          authorize Booking, :create?

          outcome = IdempotentOperation.new(
            business: Current.business,
            user: current_user,
            endpoint: "bookings#create",
            key: request.headers["Idempotency-Key"],
            payload: booking_params.to_h
          ).call { process_booking_request }

          render json: outcome.body, status: outcome.status
        rescue IdempotentOperation::MissingKey
          render_error(
            status: :bad_request,
            code: "missing_idempotency_key",
            message: "An Idempotency-Key header is required for this request."
          )
        rescue IdempotentOperation::PayloadMismatch
          render_error(
            status: :conflict,
            code: "idempotency_key_conflict",
            message: "This Idempotency-Key was already used with a different request."
          )
        rescue IdempotentOperation::ProcessingConflict
          render_error(
            status: :conflict,
            code: "request_in_progress",
            message: "This request is already being processed. Please retry shortly."
          )
        end

        private

        def process_booking_request
          result = BookingRequestService.new(
            business: Current.business,
            customer: current_user,
            service_offering_id: booking_params[:service_offering_id],
            pet_ids: Array(booking_params[:pet_ids]),
            requested_starts_at: booking_params[:requested_starts_at],
            requested_ends_at: booking_params[:requested_ends_at],
            notes: booking_params[:notes]
          ).call

          if result.success?
            IdempotentOperation::Outcome.new(status: 201, body: booking_json(result.booking))
          else
            IdempotentOperation::Outcome.new(
              status: 422,
              body: error_payload(
                code: "validation_failed",
                message: "The request could not be processed.",
                details: result.errors.to_hash
              )
            )
          end
        end

        def booking_params
          params.require(:booking).permit(
            :service_offering_id, :requested_starts_at, :requested_ends_at, :notes, pet_ids: []
          )
        end

        def booking_json(booking)
          {
            id: booking.id,
            status: booking.status,
            requested_starts_at: booking.requested_starts_at,
            requested_ends_at: booking.requested_ends_at,
            notes: booking.notes,
            denial_reason: booking.denial_reason,
            service_offering: { id: booking.service_offering.id, name: booking.service_offering.name },
            customer: { id: booking.customer.id, email: booking.customer.email },
            pets: booking.pets.map { |pet| { id: pet.id, name: pet.name } }
          }
        end
      end
    end
  end
end
