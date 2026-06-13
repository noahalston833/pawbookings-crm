require "rails_helper"

RSpec.describe CleanUpExpiredIdempotencyRecordsJob, type: :job do
  it "removes only records past their expires_at" do
    expired = create(:idempotency_record, expires_at: 1.hour.ago)
    still_valid = create(:idempotency_record, expires_at: 1.hour.from_now)

    described_class.perform_now

    expect(IdempotencyRecord.exists?(expired.id)).to be(false)
    expect(IdempotencyRecord.exists?(still_valid.id)).to be(true)
  end

  it "lets a retried request reuse a key once its expired record has been cleaned up" do
    business = create(:business)
    user = create(:user)
    create(:idempotency_record, business: business, user: user, endpoint: "test#action", key: "stale-key",
                                 expires_at: 1.hour.ago, completed_at: 1.hour.ago, response_status: 201,
                                 response_body: { "call" => 1 }.to_json)

    described_class.perform_now

    outcome = IdempotentOperation.new(
      business: business, user: user, endpoint: "test#action", key: "stale-key", payload: { "a" => 1 }
    ).call { IdempotentOperation::Outcome.new(status: 201, body: { "call" => 2 }) }

    expect(outcome.body).to eq({ "call" => 2 })
  end
end
