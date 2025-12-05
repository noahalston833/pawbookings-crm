class CreateBusinesses < ActiveRecord::Migration[8.1]
  def change
    # json (not jsonb) stays portable to MySQL's native JSON type; this
    # column isn't queried into, so jsonb's indexing advantage is moot here.
    create_table :businesses do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.string :time_zone, null: false, default: "UTC"
      t.json :settings, null: false, default: {}

      t.timestamps
    end

    add_index :businesses, :slug, unique: true
  end
end
