# Creates a pending booking request with its pets in one transaction.
# Acceptance (capacity checks, allocation creation) is a separate service
# introduced with booking decisions -- creating a request never touches
# availability at all (see docs/decisions/0005).
class BookingRequestService
  Result = Struct.new(:success?, :booking, :errors, keyword_init: true)

  def initialize(business:, customer:, service_offering_id:, pet_ids:, requested_starts_at:, requested_ends_at:, notes: nil)
    @business = business
    @customer = customer
    @service_offering_id = service_offering_id
    @pet_ids = Array(pet_ids)
    @requested_starts_at = requested_starts_at
    @requested_ends_at = requested_ends_at
    @notes = notes
  end

  def call
    booking = nil

    ActiveRecord::Base.transaction do
      booking = @business.bookings.create!(
        customer: @customer,
        service_offering_id: @service_offering_id,
        requested_starts_at: @requested_starts_at,
        requested_ends_at: @requested_ends_at,
        notes: @notes
      )
      @pet_ids.each { |pet_id| booking.booking_pets.create!(pet_id: pet_id) }
    end

    Result.new(success?: true, booking: booking, errors: nil)
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success?: false, booking: nil, errors: e.record.errors)
  end
end
