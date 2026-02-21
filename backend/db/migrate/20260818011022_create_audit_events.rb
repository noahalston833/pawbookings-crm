class CreateAuditEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_events do |t|
      t.references :business, null: false, foreign_key: true
      t.references :actor, null: false, foreign_key: { to_table: :users }
      t.string :action, null: false
      # json (not jsonb): a small snapshot, never queried into -- see the
      # same reasoning on Business#settings.
      t.json :metadata, null: false, default: {}
      t.references :target, polymorphic: true, null: true

      t.timestamps
    end

    add_index :audit_events, %i[business_id created_at]
  end
end
