class CreateMemberships < ActiveRecord::Migration[8.1]
  VALID_ROLES = %w[owner admin staff customer].freeze

  def change
    create_table :memberships do |t|
      t.references :business, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :role, null: false

      t.timestamps
    end

    # One membership per user per business; role changes update this row
    # rather than creating a second membership.
    add_index :memberships, %i[business_id user_id], unique: true

    # CHECK constraints are supported by Postgres and MySQL 8.0.16+, so this
    # stays portable while still rejecting invalid roles at the DB level.
    add_check_constraint :memberships,
                          "role IN (#{VALID_ROLES.map { |r| "'#{r}'" }.join(', ')})",
                          name: "memberships_role_check"
  end
end
