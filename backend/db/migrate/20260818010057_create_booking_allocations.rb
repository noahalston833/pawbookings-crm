class CreateBookingAllocations < ActiveRecord::Migration[8.1]
  def change
    create_table :booking_allocations do |t|
      t.references :booking, null: false, foreign_key: true
      t.references :availability_slot, null: false, foreign_key: true

      t.timestamps
    end

    add_index :booking_allocations, %i[booking_id availability_slot_id], unique: true
  end
end
