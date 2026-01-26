class CreateBookingPets < ActiveRecord::Migration[8.1]
  def change
    create_table :booking_pets do |t|
      t.references :booking, null: false, foreign_key: true
      t.references :pet, null: false, foreign_key: true

      t.timestamps
    end

    add_index :booking_pets, %i[booking_id pet_id], unique: true
  end
end
