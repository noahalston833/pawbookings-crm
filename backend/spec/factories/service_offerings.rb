FactoryBot.define do
  factory :service_offering do
    business
    sequence(:name) { |n| "Service #{n}" }
    service_kind { "daycare" }
    default_capacity { 10 }

    trait :training do
      service_kind { "training" }
      default_capacity { 1 }
      default_duration_minutes { 60 }
    end

    trait :boarding do
      service_kind { "boarding" }
      default_capacity { 5 }
    end
  end
end
