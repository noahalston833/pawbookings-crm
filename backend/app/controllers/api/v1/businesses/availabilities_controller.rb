module Api
  module V1
    module Businesses
      # Customer-facing "what can I actually book" view, distinct from
      # AvailabilitySlotsController's plain CRUD: date-ranged, active +
      # future only, and includes a computed remaining_capacity.
      #
      # remaining_capacity currently just equals capacity -- Booking and
      # BookingAllocation don't exist yet (see docs/decisions/0005 and the
      # commit history). This gets extended to subtract accepted bookings'
      # allocations once those models exist, without changing this
      # endpoint's shape.
      class AvailabilitiesController < Api::V1::TenantScopedController
        DEFAULT_RANGE_DAYS = 14
        MAX_RANGE_DAYS = 60

        def index
          offering = Current.business.service_offerings.find(params[:id])
          authorize AvailabilitySlot, :index?

          range_start, range_end = date_range
          slots = offering.availability_slots
                           .where(active: true)
                           .where(starts_at: Time.current..)
                           .where(starts_at: range_start.beginning_of_day..range_end.end_of_day)
                           .order(:starts_at)
                           .limit(200)

          render json: {
            time_zone: Current.business.time_zone,
            slots: slots.map { |slot| availability_json(slot) }
          }
        end

        private

        def date_range
          range_start = parse_date(params[:from]) || Time.zone.today
          requested_end = parse_date(params[:to]) || range_start + DEFAULT_RANGE_DAYS
          range_end = [ requested_end, range_start + MAX_RANGE_DAYS ].min
          [ range_start, range_end ]
        end

        def parse_date(value)
          return nil if value.blank?

          Date.iso8601(value)
        rescue ArgumentError
          nil
        end

        def availability_json(slot)
          {
            id: slot.id,
            starts_at: slot.starts_at,
            ends_at: slot.ends_at,
            capacity: slot.capacity,
            remaining_capacity: slot.capacity
          }
        end
      end
    end
  end
end
