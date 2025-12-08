require 'rails_helper'

RSpec.describe Business, type: :model do
  it "is valid with a valid factory" do
    expect(build(:business)).to be_valid
  end

  it "requires a name" do
    business = build(:business, name: nil)
    expect(business).not_to be_valid
    expect(business.errors[:name]).to be_present
  end

  it "requires a slug matching the allowed format" do
    business = build(:business, slug: "Not A Valid Slug!")
    expect(business).not_to be_valid
    expect(business.errors[:slug]).to be_present
  end

  it "requires a unique slug" do
    create(:business, slug: "paws-and-play")
    duplicate = build(:business, slug: "paws-and-play")
    expect(duplicate).not_to be_valid
    expect(duplicate.errors[:slug]).to be_present
  end

  it "rejects a time zone Rails doesn't recognize" do
    business = build(:business, time_zone: "Not/A_Zone")
    expect(business).not_to be_valid
    expect(business.errors[:time_zone]).to be_present
  end

  it "accepts a real IANA time zone" do
    business = build(:business, time_zone: "America/Los_Angeles")
    expect(business).to be_valid
  end

  describe "associations" do
    it "has many memberships and users through them" do
      business = create(:business)
      membership = create(:membership, business: business)

      expect(business.memberships).to include(membership)
      expect(business.users).to include(membership.user)
    end
  end
end
