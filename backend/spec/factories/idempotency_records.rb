FactoryBot.define do
  factory :idempotency_record do
    business
    user
    sequence(:key) { |n| "key-#{n}" }
    endpoint { "bookings#create" }
    request_fingerprint { "fingerprint" }
    expires_at { 24.hours.from_now }
  end
end
