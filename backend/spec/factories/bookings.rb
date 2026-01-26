FactoryBot.define do
  factory :booking do
    service_offering
    business { service_offering.business }
    customer factory: %i[user]
    requested_starts_at { 1.day.from_now }
    requested_ends_at { 2.days.from_now }

    trait :accepted do
      status { "accepted" }
    end

    trait :denied do
      status { "denied" }
    end
  end
end
