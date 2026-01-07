# Creates a business, its owner, and the owner membership in one
# transaction -- a half-created business (e.g. no owner because the
# password was invalid) would be unrecoverable through the normal UI, so
# nothing is allowed to persist unless every step succeeds.
class BusinessSignup
  Result = Struct.new(:success?, :business, :user, :errors, keyword_init: true)

  DEFAULT_SETTINGS = { "cancellation_window_hours" => 24 }.freeze

  # One of each service kind so a new business has something bookable
  # (and something to see in the dashboard) immediately after signup,
  # without forcing the owner through setup steps before the demo/trial
  # value of the product is visible.
  DEFAULT_SERVICE_OFFERINGS = [
    { name: "Daycare", service_kind: "daycare", default_capacity: 10 },
    { name: "Training", service_kind: "training", default_capacity: 1, default_duration_minutes: 60 },
    { name: "Boarding", service_kind: "boarding", default_capacity: 5 }
  ].freeze

  def initialize(business_name:, business_slug:, time_zone:, owner_email:, owner_password:)
    @business_name = business_name
    @business_slug = business_slug
    @time_zone = time_zone
    @owner_email = owner_email
    @owner_password = owner_password
  end

  def call
    business = user = nil

    ActiveRecord::Base.transaction do
      business = Business.create!(
        name: @business_name,
        slug: @business_slug,
        time_zone: @time_zone,
        settings: DEFAULT_SETTINGS
      )
      user = User.create!(email: @owner_email, password: @owner_password)
      business.memberships.create!(user: user, role: :owner)
      DEFAULT_SERVICE_OFFERINGS.each { |attrs| business.service_offerings.create!(attrs) }
    end

    Result.new(success?: true, business: business, user: user, errors: nil)
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success?: false, business: nil, user: nil, errors: e.record.errors)
  end
end
