require 'rails_helper'

RSpec.describe Pet, type: :model do
  it "is valid with a valid factory" do
    expect(build(:pet)).to be_valid
  end

  it "requires a name" do
    expect(build(:pet, name: nil)).not_to be_valid
  end

  it "rejects a species other than dog" do
    pet = build(:pet, species: "cat")
    expect(pet).not_to be_valid
    expect(pet.errors[:species]).to be_present
  end

  it "rejects a non-positive weight" do
    pet = build(:pet, weight: 0)
    expect(pet).not_to be_valid
    expect(pet.errors[:weight]).to be_present
  end

  it "rejects a birth date in the future" do
    pet = build(:pet, birth_date: 1.day.from_now.to_date)
    expect(pet).not_to be_valid
    expect(pet.errors[:birth_date]).to be_present
  end

  it "requires a vaccination expiration date when marked up to date" do
    pet = build(:pet, vaccination_status: "up_to_date", vaccination_expires_on: nil)
    expect(pet).not_to be_valid
    expect(pet.errors[:vaccination_expires_on]).to be_present
  end

  it "does not require an expiration date when vaccination status is unknown" do
    pet = build(:pet, vaccination_status: "unknown", vaccination_expires_on: nil)
    expect(pet).to be_valid
  end

  it "defaults to active status" do
    expect(create(:pet).status).to eq("active")
  end
end
