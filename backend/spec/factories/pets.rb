FactoryBot.define do
  factory :pet do
    business
    user
    sequence(:name) { |n| "Dog #{n}" }
    species { "dog" }
    breed { "Labrador Retriever" }
    birth_date { 2.years.ago.to_date }
    weight { 25.5 }
    sex { "female" }
    vaccination_status { "up_to_date" }
    vaccination_expires_on { 6.months.from_now.to_date }
    feeding_instructions { "Half a cup twice daily" }

    trait :archived do
      status { "archived" }
    end
  end
end
