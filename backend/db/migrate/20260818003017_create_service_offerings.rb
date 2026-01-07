class CreateServiceOfferings < ActiveRecord::Migration[8.1]
  VALID_KINDS = %w[daycare training boarding].freeze

  def change
    create_table :service_offerings do |t|
      t.references :business, null: false, foreign_key: true
      t.string :name, null: false
      t.string :service_kind, null: false
      t.text :description
      t.boolean :active, null: false, default: true
      t.integer :default_capacity, null: false
      t.integer :default_duration_minutes
      t.text :customer_facing_instructions

      t.timestamps
    end

    add_check_constraint :service_offerings,
                          "service_kind IN (#{VALID_KINDS.map { |k| "'#{k}'" }.join(', ')})",
                          name: "service_offerings_service_kind_check"
    add_check_constraint :service_offerings, "default_capacity > 0",
                          name: "service_offerings_default_capacity_positive_check"
    add_check_constraint :service_offerings,
                          "default_duration_minutes IS NULL OR default_duration_minutes > 0",
                          name: "service_offerings_duration_positive_check"
  end
end
