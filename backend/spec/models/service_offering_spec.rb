require 'rails_helper'

RSpec.describe ServiceOffering, type: :model do
  it "is valid with a valid factory" do
    expect(build(:service_offering)).to be_valid
  end

  it "requires a name" do
    expect(build(:service_offering, name: nil)).not_to be_valid
  end

  it "rejects a service kind outside daycare/training/boarding" do
    offering = build(:service_offering, service_kind: "grooming")
    expect(offering).not_to be_valid
    expect(offering.errors[:service_kind]).to be_present
  end

  it "rejects a non-positive default capacity" do
    offering = build(:service_offering, default_capacity: 0)
    expect(offering).not_to be_valid
    expect(offering.errors[:default_capacity]).to be_present
  end

  it "defaults to active" do
    expect(create(:service_offering).active).to be(true)
  end
end
