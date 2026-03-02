class BookingDeniedNotificationJob < ApplicationJob
  queue_as :default
  discard_on ActiveRecord::RecordNotFound

  def perform(business_id:, booking_id:)
    business = Business.find(business_id)
    booking = business.bookings.find(booking_id)

    return unless booking.denied?
    return unless claim_notification!(booking)

    Rails.logger.info("event=booking_notification action=denied business_id=#{business_id} booking_id=#{booking_id}")
    BookingMailer.denied_email(booking).deliver_now
  end

  private

  def claim_notification!(booking)
    Booking.where(id: booking.id, notified_at: nil).update_all(notified_at: Time.current) == 1
  end
end
