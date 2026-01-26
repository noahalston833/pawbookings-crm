class CreateBookings < ActiveRecord::Migration[8.1]
  VALID_STATUSES = %w[pending accepted denied cancelled completed].freeze

  def change
    create_table :bookings do |t|
      t.references :business, null: false, foreign_key: true
      t.references :customer, null: false, foreign_key: { to_table: :users }
      t.references :service_offering, null: false, foreign_key: true
      t.string :status, null: false, default: "pending"
      t.datetime :requested_starts_at, null: false
      t.datetime :requested_ends_at, null: false
      t.text :notes
      t.text :denial_reason
      # Optimistic locking: two staff members accepting/denying the same
      # booking at once should have one of them collide, not silently
      # overwrite the other's decision.
      t.integer :lock_version, null: false, default: 0

      t.timestamps
    end

    add_index :bookings, %i[business_id status]
    add_index :bookings, %i[business_id customer_id]
    add_check_constraint :bookings,
                          "status IN (#{VALID_STATUSES.map { |s| "'#{s}'" }.join(', ')})",
                          name: "bookings_status_check"
    add_check_constraint :bookings, "requested_ends_at > requested_starts_at",
                          name: "bookings_end_after_start_check"
  end
end
