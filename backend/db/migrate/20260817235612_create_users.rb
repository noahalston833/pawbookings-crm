class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.boolean :platform_admin, null: false, default: false

      t.timestamps
    end

    # Email is normalized (stripped + downcased) before save, so a plain
    # unique index on the stored value is sufficient here.
    add_index :users, :email, unique: true
  end
end
