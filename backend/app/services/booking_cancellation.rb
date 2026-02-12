# Cancellable from pending or accepted -- once denied/cancelled/completed
# there's nothing left to cancel. Cancelling an accepted booking releases
# its allocations so the freed capacity is immediately bookable again.
class BookingCancellation
  Result = Struct.new(:success?, :booking, :error_code, :error_message, keyword_init: true)

  CANCELLABLE_STATUSES = %w[pending accepted].freeze

  def initialize(booking:)
    @booking_id = booking.id
  end

  def call
    ActiveRecord::Base.transaction do
      booking = Booking.lock.find(@booking_id)
      return invalid_transition_result(booking) unless CANCELLABLE_STATUSES.include?(booking.status)

      booking.booking_allocations.destroy_all
      booking.update!(status: :cancelled)
      Result.new(success?: true, booking: booking)
    end
  end

  private

  def invalid_transition_result(booking)
    Result.new(
      success?: false, booking: booking, error_code: "invalid_state_transition",
      error_message: "This booking has already been #{booking.status} and cannot be cancelled."
    )
  end
end
