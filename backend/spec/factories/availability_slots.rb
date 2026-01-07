FactoryBot.define do
  factory :availability_slot do
    service_offering
    business { service_offering.business }
    starts_at { 1.day.from_now.change(hour: 7) }
    ends_at { 1.day.from_now.change(hour: 18) }
    capacity { 10 }
  end
end
