require 'rails_helper'

RSpec.describe IdempotencyRecord, type: :model do
  it "is valid with a valid factory" do
    expect(build(:idempotency_record)).to be_valid
  end

  it "is not completed until completed_at is set" do
    expect(build(:idempotency_record).completed?).to be(false)
    expect(build(:idempotency_record, completed_at: Time.current).completed?).to be(true)
  end

  it "enforces one record per business/user/endpoint/key at the database level" do
    create(:idempotency_record, business: (business = create(:business)), user: (user = create(:user)),
                                 endpoint: "bookings#create", key: "dup")

    duplicate = build(:idempotency_record, business: business, user: user, endpoint: "bookings#create", key: "dup")

    expect { duplicate.save!(validate: false) }.to raise_error(ActiveRecord::RecordNotUnique)
  end
end
