module Api
  module V1
    module Businesses
      class BookingsController < Api::V1::TenantScopedController
        def index
          authorize Booking, :index?

          bookings = paginate(
            policy_scope(Current.business.bookings)
              .then { |scope| filter_by_status(scope) }
              .includes(:service_offering, :customer, :pets)
              .order(created_at: :desc)
          )
          render json: bookings.map { |booking| booking_json(booking) }
        end

        def show
          booking = Current.business.bookings.includes(:service_offering, :customer, :pets).find(params[:id])
          authorize booking
          render json: booking_json(booking)
        end

        def create
          authorize Booking, :create?

          outcome = idempotent("bookings#create", booking_params.to_h) { process_booking_request }
          render json: outcome.body, status: outcome.status
        end

        def accept
          booking = Current.business.bookings.find(params[:id])
          authorize booking

          outcome = idempotent("bookings#accept", { booking_id: booking.id }) {
            result = BookingAcceptance.new(booking: booking).call
            on_booking_decided(result, action: "booking.accepted", job: BookingAcceptedNotificationJob)
          }
          render json: outcome.body, status: outcome.status
        end

        def deny
          booking = Current.business.bookings.find(params[:id])
          authorize booking

          outcome = idempotent("bookings#deny", { booking_id: booking.id, reason: deny_params[:reason] }) {
            result = BookingDenial.new(booking: booking, reason: deny_params[:reason]).call
            on_booking_decided(result, action: "booking.denied", job: BookingDeniedNotificationJob,
                                       metadata: { reason: deny_params[:reason] })
          }
          render json: outcome.body, status: outcome.status
        end

        def cancel
          booking = Current.business.bookings.find(params[:id])
          authorize booking

          outcome = idempotent("bookings#cancel", { booking_id: booking.id }) {
            process_decision(BookingCancellation.new(booking: booking).call)
          }
          render json: outcome.body, status: outcome.status
        end

        private

        # Ignores anything that isn't a real status rather than raising --
        # an unrecognized value just means "no filter", which is a safe,
        # boring behavior for a query param the client fully controls.
        def filter_by_status(scope)
          return scope unless Booking.statuses.key?(params[:status])

          scope.where(status: params[:status])
        end

        def idempotent(endpoint, payload)
          IdempotentOperation.new(
            business: Current.business, user: current_user, endpoint: endpoint,
            key: request.headers["Idempotency-Key"], payload: payload
          ).call { yield }
        end

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
            validation_failed_outcome(result.errors.to_hash)
          end
        end

        # Shared response shaping for the three decision services -- each
        # returns the same success?/booking/error_code/error_message shape.
        def process_decision(result)
          return IdempotentOperation::Outcome.new(status: 200, body: booking_json(result.booking)) if result.success?

          status = result.error_code == "availability_conflict" ? 409 : 422
          IdempotentOperation::Outcome.new(
            status: status,
            body: error_payload(code: result.error_code, message: result.error_message)
          )
        end

        # Accept/deny additionally audit-log the decision and enqueue a
        # notification -- only on genuine success, never on a replayed
        # idempotent outcome (this block only runs once per real decision).
        def on_booking_decided(result, action:, job:, metadata: {})
          if result.success?
            AuditEvent.record!(business: Current.business, actor: current_user, action: action,
                                target: result.booking, metadata: metadata)
            job.perform_later(business_id: Current.business.id, booking_id: result.booking.id)
          end
          process_decision(result)
        end

        def validation_failed_outcome(details)
          IdempotentOperation::Outcome.new(
            status: 422,
            body: error_payload(code: "validation_failed", message: "The request could not be processed.", details: details)
          )
        end

        def booking_params
          params.require(:booking).permit(
            :service_offering_id, :requested_starts_at, :requested_ends_at, :notes, pet_ids: []
          )
        end

        def deny_params
          params.fetch(:booking, {}).permit(:reason)
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
