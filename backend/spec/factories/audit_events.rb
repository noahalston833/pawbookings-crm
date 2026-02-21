FactoryBot.define do
  factory :audit_event do
    business
    actor factory: %i[user]
    action { "booking.accepted" }
    metadata { {} }
  end
end
