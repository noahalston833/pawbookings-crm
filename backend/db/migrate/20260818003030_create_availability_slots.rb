class CreateAvailabilitySlots < ActiveRecord::Migration[8.1]
  def change
    create_table :availability_slots do |t|
      t.references :business, null: false, foreign_key: true
      t.references :service_offering, null: false, foreign_key: true
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.integer :capacity, null: false
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    # Supports the customer availability query: one offering, a date
    # range, active only (see docs/performance.md, added later).
    add_index :availability_slots, %i[service_offering_id starts_at]
    # No two slots for the same offering can claim the exact same window.
    add_index :availability_slots, %i[service_offering_id starts_at ends_at],
              unique: true, name: "index_availability_slots_on_offering_and_window"
    add_check_constraint :availability_slots, "capacity > 0",
                          name: "availability_slots_capacity_positive_check"
    add_check_constraint :availability_slots, "ends_at > starts_at",
                          name: "availability_slots_end_after_start_check"
  end
end
