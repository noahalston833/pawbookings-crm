require 'rails_helper'

RSpec.describe Membership, type: :model do
  it "is valid with a valid factory" do
    expect(build(:membership)).to be_valid
  end

  it "rejects a role outside the known set" do
    membership = build(:membership, role: "superadmin")
    expect(membership).not_to be_valid
    expect(membership.errors[:role]).to be_present
  end

  it "rejects a second membership for the same user in the same business" do
    business = create(:business)
    user = create(:user)
    create(:membership, business: business, user: user)

    duplicate = build(:membership, business: business, user: user)
    expect(duplicate).not_to be_valid
    expect(duplicate.errors[:user_id]).to be_present
  end

  it "allows the same user to have memberships in different businesses" do
    user = create(:user)
    create(:membership, business: create(:business), user: user)
    second = build(:membership, business: create(:business), user: user)

    expect(second).to be_valid
  end

  describe "last-owner protection" do
    it "refuses to destroy a business's only owner membership" do
      owner_membership = create(:membership, :owner)

      expect(owner_membership.destroy).to be(false)
      expect(owner_membership.errors[:base]).to be_present
      expect(Membership.exists?(owner_membership.id)).to be(true)
    end

    it "allows destroying an owner membership when another owner exists" do
      business = create(:business)
      owner_membership = create(:membership, :owner, business: business)
      create(:membership, :owner, business: business)

      expect(owner_membership.destroy).to eq(owner_membership)
    end

    it "refuses to change the last owner's role to something else" do
      owner_membership = create(:membership, :owner)

      owner_membership.role = "staff"
      expect(owner_membership).not_to be_valid
      expect(owner_membership.errors[:role]).to be_present
    end

    it "allows changing an owner's role when another owner exists" do
      business = create(:business)
      owner_membership = create(:membership, :owner, business: business)
      create(:membership, :owner, business: business)

      owner_membership.role = "admin"
      expect(owner_membership).to be_valid
    end
  end
end
