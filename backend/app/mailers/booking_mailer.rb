# Booking notifications are non-essential side effects, sent from
# background jobs (BookingAcceptedNotificationJob/BookingDeniedNotificationJob),
# never inline during the request that made the decision.
class BookingMailer < ApplicationMailer
  def accepted_email(booking)
    @booking = booking
    mail(to: booking.customer.email, subject: "Your booking request was accepted")
  end

  def denied_email(booking)
    @booking = booking
    mail(to: booking.customer.email, subject: "Update on your booking request")
  end
end
