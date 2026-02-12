# Explicit workflow service (not a model callback) for the one transition
# that actually touches capacity. Locks every required slot in a single
# transaction, in a consistent order (by id), before checking capacity --
# that ordering is what keeps two concurrent acceptances from deadlocking
# each other instead of one just waiting briefly.
class BookingAcceptance
  Result = Struct.new(:success?, :booking, :error_code, :error_message, keyword_init: true)

  def initialize(booking:)
    @booking_id = booking.id
  end

  def call
    ActiveRecord::Base.transaction do
      booking = Booking.lock.find(@booking_id)
      return invalid_transition_result(booking) unless booking.pending?

      slots = required_slots(booking)
      return conflict_result(booking) if slots.empty?

      locked_slots = AvailabilitySlot.where(id: slots.map(&:id)).order(:id).lock.to_a
      return conflict_result(booking) unless capacity_available?(locked_slots)

      locked_slots.each { |slot| booking.booking_allocations.create!(availability_slot: slot) }
      booking.update!(status: :accepted)

      Result.new(success?: true, booking: booking)
    end
  end

  private

  # Every AvailabilitySlot fully inside the requested window: one row for
  # daycare/training, one per night for boarding (see docs/decisions/0003).
  def required_slots(booking)
    booking.service_offering.availability_slots
           .where(active: true)
           .where("starts_at >= ? AND ends_at <= ?", booking.requested_starts_at, booking.requested_ends_at)
           .order(:id)
  end

  # Capacity is spent per accepted BOOKING per slot (one BookingAllocation
  # row each), not per pet -- matching the schema (BookingAllocation has no
  # pet reference). A boarding request must find capacity on every
  # required night or none are reserved.
  def capacity_available?(locked_slots)
    locked_slots.all? do |slot|
      accepted_count = slot.booking_allocations.joins(:booking).merge(Booking.where(status: "accepted")).count
      accepted_count < slot.capacity
    end
  end

  def invalid_transition_result(booking)
    Result.new(
      success?: false, booking: booking, error_code: "invalid_state_transition",
      error_message: "This booking has already been #{booking.status} and cannot be accepted again."
    )
  end

  def conflict_result(booking)
    Result.new(
      success?: false, booking: booking, error_code: "availability_conflict",
      error_message: "The requested service is no longer available."
    )
  end
end
