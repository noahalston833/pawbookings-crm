class CreatePets < ActiveRecord::Migration[8.1]
  def change
    create_table :pets do |t|
      t.references :business, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :species, null: false
      t.string :breed
      t.date :birth_date
      t.decimal :weight, precision: 5, scale: 2
      t.string :sex, null: false
      t.string :vaccination_status, null: false, default: "unknown"
      t.date :vaccination_expires_on
      t.text :feeding_instructions
      t.text :medication_instructions
      t.text :behavioral_notes
      t.text :emergency_notes
      t.string :status, null: false, default: "active"

      t.timestamps
    end

    # Pets are frequently listed "by business" (staff dashboards) and "by
    # business + owner" (a customer's own pets) -- both are covered by one
    # composite index since business_id is always the leading column.
    add_index :pets, %i[business_id user_id]

    add_check_constraint :pets, "weight IS NULL OR weight > 0", name: "pets_weight_positive_check"
    add_check_constraint :pets, "species IN ('dog')", name: "pets_species_check"
    add_check_constraint :pets, "sex IN ('male', 'female')", name: "pets_sex_check"
    add_check_constraint :pets,
                          "vaccination_status IN ('up_to_date', 'expired', 'unknown')",
                          name: "pets_vaccination_status_check"
    add_check_constraint :pets, "status IN ('active', 'archived')", name: "pets_status_check"
  end
end
