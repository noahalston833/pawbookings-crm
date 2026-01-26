class CreateIdempotencyRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :idempotency_records do |t|
      t.references :business, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :key, null: false
      t.string :endpoint, null: false
      t.string :request_fingerprint, null: false
      t.integer :response_status
      t.text :response_body
      t.datetime :completed_at
      t.datetime :expires_at, null: false

      t.timestamps
    end

    # The DB constraint, not just the application check, is what actually
    # prevents two concurrent requests with the same key from both
    # "winning" -- see app/services/idempotent_operation.rb.
    add_index :idempotency_records, %i[business_id user_id endpoint key],
              unique: true, name: "index_idempotency_records_scope"
  end
end
