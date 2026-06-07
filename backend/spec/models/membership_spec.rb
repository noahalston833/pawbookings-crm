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

      expect(owner_membership.update(role: "staff")).to be(false)
      expect(owner_membership.errors[:role]).to be_present
      expect(owner_membership.reload.role).to eq("owner")
    end

    it "allows changing an owner's role when another owner exists" do
      business = create(:business)
      owner_membership = create(:membership, :owner, business: business)
      create(:membership, :owner, business: business)

      expect(owner_membership.update(role: "admin")).to be(true)
    end

    it "does not leave a business with zero owners when two removal attempts race", :concurrency do
      business = create(:business)
      owner_a = create(:membership, :owner, business: business)
      owner_b = create(:membership, :owner, business: business)

      ActiveRecord::Base.connection_pool.disconnect!
      results = []
      mutex = Mutex.new
      started = 0

      [ owner_a, owner_b ].map do |membership|
        Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do
            mutex.synchronize { started += 1 }
            sleep 0.01 until started == 2

            mutex.synchronize { results << membership.destroy }
          end
        end
      end.each(&:join)

      expect(results.count { |result| result != false }).to eq(1)
      expect(business.memberships.owner.count).to eq(1)
    end

    it "does not leave a business with zero owners when a removal races a demotion", :concurrency do
      business = create(:business)
      owner_a = create(:membership, :owner, business: business)
      owner_b = create(:membership, :owner, business: business)

      ActiveRecord::Base.connection_pool.disconnect!
      results = []
      mutex = Mutex.new
      started = 0

      threads = [
        Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do
            mutex.synchronize { started += 1 }
            sleep 0.01 until started == 2
            mutex.synchronize { results << owner_a.destroy }
          end
        end,
        Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do
            mutex.synchronize { started += 1 }
            sleep 0.01 until started == 2
            mutex.synchronize { results << owner_b.update(role: "admin") }
          end
        end
      ]
      threads.each(&:join)

      expect(results.count { |result| result != false }).to eq(1)
      expect(business.memberships.owner.count).to eq(1)
    end
  end
end
