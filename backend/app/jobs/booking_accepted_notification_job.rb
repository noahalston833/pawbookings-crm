# Accepts IDs, not serialized models (Booking may change between enqueue
# and execution). Reloaded through business.bookings so a wrong/stale
# business_id fails loudly instead of touching another tenant's booking.
class BookingAcceptedNotificationJob < ApplicationJob
  queue_as :default
  discard_on ActiveRecord::RecordNotFound

  def perform(business_id:, booking_id:)
    business = Business.find(business_id)
    booking = business.bookings.find(booking_id)

    return unless booking.accepted?
    return unless claim_notification!(booking)

    Rails.logger.info("event=booking_notification action=accepted business_id=#{business_id} booking_id=#{booking_id}")
    BookingMailer.accepted_email(booking).deliver_now
  end

  private

  # Atomic claim-and-mark: if a retry (or a duplicate enqueue) runs this
  # job again after the email already went out, this update affects zero
  # rows and the retry is a safe no-op instead of a second email.
  def claim_notification!(booking)
    Booking.where(id: booking.id, notified_at: nil).update_all(notified_at: Time.current) == 1
  end
end
