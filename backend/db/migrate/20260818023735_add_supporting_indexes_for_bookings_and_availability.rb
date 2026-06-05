class AddSupportingIndexesForBookingsAndAvailability < ActiveRecord::Migration[8.1]
  def change
    # Covers the customer-facing availability query (active, future,
    # date-ranged, ordered by starts_at) -- the existing
    # (service_offering_id, starts_at) index doesn't include `active`, so
    # Postgres has to filter it out after the range scan.
    add_index :availability_slots, [ :service_offering_id, :active, :starts_at ],
              name: "index_availability_slots_on_offering_active_and_starts_at"

    # Covers GET .../bookings?status=X (added alongside this migration so
    # the dashboard queue can filter server-side instead of fetching
    # every booking and filtering in the browser).
    add_index :bookings, [ :business_id, :status, :created_at ],
               name: "index_bookings_on_business_id_status_and_created_at"

    # Covers the unfiltered ("All statuses") case, which the 3-column
    # index above can't serve efficiently for ORDER BY created_at (rows
    # are grouped by status first).
    add_index :bookings, [ :business_id, :created_at ]

    # Superseded by the new 3-column index above (same leading columns).
    remove_index :bookings, [ :business_id, :status ]
  end
end
