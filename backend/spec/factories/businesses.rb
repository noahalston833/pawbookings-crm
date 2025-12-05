FactoryBot.define do
  factory :business do
    sequence(:name) { |n| "Business #{n}" }
    sequence(:slug) { |n| "business-#{n}" }
    time_zone { "America/New_York" }
  end
end
