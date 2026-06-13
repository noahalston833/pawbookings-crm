# Idempotency records carry an expires_at (see IdempotentOperation::TTL)
# but nothing enforces it in the read path -- checking expiry there would
# need its own locking to stay race-free for concurrent retries of the
# same stale key. The standard, simpler approach (also what most
# idempotency-key implementations do): expired records are just garbage
# collected periodically, so by the time a client retries long after TTL,
# the old record is already gone and the request is naturally treated as
# new. See config/recurring.yml.
class CleanUpExpiredIdempotencyRecordsJob < ApplicationJob
  queue_as :default

  def perform
    IdempotencyRecord.where(expires_at: ...Time.current).delete_all
  end
end
