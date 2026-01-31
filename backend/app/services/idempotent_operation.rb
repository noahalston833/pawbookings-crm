# Wraps a mutation so that a repeated Idempotency-Key with the same
# payload replays the original response instead of reprocessing, a reused
# key with a different payload is rejected, and concurrent requests for
# the same key cannot both perform the underlying action.
#
# The uniqueness constraint on idempotency_records(business_id, user_id,
# endpoint, key) -- not this class's own logic -- is what actually
# prevents two concurrent requests from both winning: only one INSERT can
# succeed, so only one caller ever runs the block.
class IdempotentOperation
  class MissingKey < StandardError; end
  class PayloadMismatch < StandardError; end
  class ProcessingConflict < StandardError; end

  Outcome = Struct.new(:status, :body, keyword_init: true)

  TTL = 24.hours
  POLL_INTERVAL = 0.05
  POLL_ATTEMPTS = 20

  def initialize(business:, user:, endpoint:, key:, payload:)
    raise MissingKey if key.blank?

    @business = business
    @user = user
    @endpoint = endpoint
    @key = key
    @fingerprint = Digest::SHA256.hexdigest(payload.to_json)
  end

  def call
    record = existing_record
    return handle_existing(record) if record

    begin
      record = create_record!
    rescue ActiveRecord::RecordNotUnique
      # Lost the race: another request (concurrent, or a genuine retry)
      # claimed this key a moment ago.
      return handle_existing(existing_record!)
    end

    process(record) { yield }
  end

  private

  def existing_record
    IdempotencyRecord.find_by(business: @business, user: @user, endpoint: @endpoint, key: @key)
  end

  def existing_record!
    IdempotencyRecord.find_by!(business: @business, user: @user, endpoint: @endpoint, key: @key)
  end

  def create_record!
    IdempotencyRecord.create!(
      business: @business, user: @user, endpoint: @endpoint, key: @key,
      request_fingerprint: @fingerprint, expires_at: TTL.from_now
    )
  end

  def handle_existing(record)
    raise PayloadMismatch if record.request_fingerprint != @fingerprint
    return replay(record) if record.completed?

    record = wait_for_completion(record)
    return replay(record) if record.completed?

    raise ProcessingConflict
  end

  def process(record)
    outcome = yield
  rescue StandardError
    # Never cache an unexpected failure as if it succeeded -- remove the
    # claim entirely so a retry can reprocess from scratch.
    record.destroy
    raise
  else
    record.update!(completed_at: Time.current, response_status: outcome.status, response_body: outcome.body.to_json)
    outcome
  end

  def wait_for_completion(record)
    POLL_ATTEMPTS.times do
      sleep POLL_INTERVAL
      record.reload
      return record if record.completed?
    end
    record
  end

  def replay(record)
    Outcome.new(status: record.response_status, body: JSON.parse(record.response_body))
  end
end
