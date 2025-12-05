FactoryBot.define do
  factory :membership do
    business
    user
    role { "customer" }

    trait :owner do
      role { "owner" }
    end

    trait :admin do
      role { "admin" }
    end

    trait :staff do
      role { "staff" }
    end
  end
end
