class BookingDenial
  Result = Struct.new(:success?, :booking, :error_code, :error_message, keyword_init: true)

  def initialize(booking:, reason: nil)
    @booking_id = booking.id
    @reason = reason
  end

  def call
    ActiveRecord::Base.transaction do
      booking = Booking.lock.find(@booking_id)
      return invalid_transition_result(booking) unless booking.pending?

      booking.update!(status: :denied, denial_reason: @reason)
      Result.new(success?: true, booking: booking)
    end
  end

  private

  def invalid_transition_result(booking)
    Result.new(
      success?: false, booking: booking, error_code: "invalid_state_transition",
      error_message: "This booking has already been #{booking.status} and cannot be denied."
    )
  end
end
