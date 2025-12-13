# Creates a business, its owner, and the owner membership in one
# transaction -- a half-created business (e.g. no owner because the
# password was invalid) would be unrecoverable through the normal UI, so
# nothing is allowed to persist unless every step succeeds.
class BusinessSignup
  Result = Struct.new(:success?, :business, :user, :errors, keyword_init: true)

  DEFAULT_SETTINGS = { "cancellation_window_hours" => 24 }.freeze

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
    end

    Result.new(success?: true, business: business, user: user, errors: nil)
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success?: false, business: nil, user: nil, errors: e.record.errors)
  end
end
