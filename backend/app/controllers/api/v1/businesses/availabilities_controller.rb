module Api
  module V1
    module Businesses
      # Customer-facing "what can I actually book" view, distinct from
      # AvailabilitySlotsController's plain CRUD: date-ranged, active +
      # future only, and includes a computed remaining_capacity (capacity
      # minus accepted bookings' allocations -- pending requests reserve
      # nothing, see docs/decisions/0005).
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
                           .to_a

          accepted_counts = accepted_allocation_counts(slots)

          render json: {
            time_zone: Current.business.time_zone,
            slots: slots.map { |slot| availability_json(slot, accepted_counts[slot.id] || 0) }
          }
        end

        private

        # One aggregate query covering every slot on the page, not one
        # query per slot -- avoids N+1 as the date range/slot count grows.
        def accepted_allocation_counts(slots)
          return {} if slots.empty?

          BookingAllocation.joins(:booking)
                            .where(availability_slot_id: slots.map(&:id))
                            .merge(Booking.where(status: "accepted"))
                            .group(:availability_slot_id)
                            .count
        end

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

        def availability_json(slot, accepted_count)
          {
            id: slot.id,
            starts_at: slot.starts_at,
            ends_at: slot.ends_at,
            capacity: slot.capacity,
            remaining_capacity: [ slot.capacity - accepted_count, 0 ].max
          }
        end
      end
    end
  end
end
