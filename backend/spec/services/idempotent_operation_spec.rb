require "rails_helper"

RSpec.describe IdempotentOperation, type: :model do
  let(:business) { create(:business) }
  let(:user) { create(:user) }
  let(:payload) { { "a" => 1 } }

  def run(key: "k1", payload: self.payload, &block)
    described_class.new(business: business, user: user, endpoint: "test#action", key: key, payload: payload)
                   .call(&(block || -> { described_class::Outcome.new(status: 201, body: { "ok" => true }) }))
  end

  it "raises MissingKey when no key is given" do
    expect {
      described_class.new(business: business, user: user, endpoint: "test#action", key: nil, payload: payload).call
    }.to raise_error(described_class::MissingKey)
  end

  it "processes the block and stores the outcome on first use" do
    outcome = run
    expect(outcome.status).to eq(201)

    record = IdempotencyRecord.last
    expect(record.completed?).to be(true)
    expect(record.response_status).to eq(201)
  end

  it "replays the stored response for a retry with the same key and payload" do
    calls = 0
    block = -> {
      calls += 1
      described_class::Outcome.new(status: 201, body: { "call" => calls })
    }

    first = run(&block)
    second = run(&block)

    expect(calls).to eq(1)
    expect(second.body).to eq(first.body)
  end

  it "raises PayloadMismatch when the same key is reused with a different payload" do
    run(key: "k2", payload: { "a" => 1 })

    expect {
      run(key: "k2", payload: { "a" => 2 })
    }.to raise_error(described_class::PayloadMismatch)
  end

  it "does not persist a completed record when the block raises" do
    expect {
      run { raise "boom" }
    }.to raise_error("boom")

    expect(IdempotencyRecord.count).to eq(0)
  end

  it "allows a clean retry after a prior attempt raised" do
    expect { run(key: "k3") { raise "boom" } }.to raise_error("boom")

    outcome = run(key: "k3")
    expect(outcome.status).to eq(201)
  end

  it "does not create duplicate bookings under concurrent requests with the same key", :concurrency do
    ActiveRecord::Base.connection_pool.disconnect!
    results = []
    mutex = Mutex.new
    started = 0

    threads = Array.new(3) do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          mutex.synchronize { started += 1 }
          sleep 0.01 until started == 3 # line the threads up to race

          outcome = described_class.new(
            business: business, user: user, endpoint: "test#action", key: "race", payload: payload
          ).call do
            sleep 0.05 # widen the race window
            described_class::Outcome.new(status: 201, body: { "created_at" => Time.now.to_f })
          end

          mutex.synchronize { results << outcome }
        end
      end
    end
    threads.each(&:join)

    expect(IdempotencyRecord.where(business: business, user: user, key: "race").count).to eq(1)
    expect(results.map(&:body).uniq.size).to eq(1) # every thread saw the same winning response
  end
end
