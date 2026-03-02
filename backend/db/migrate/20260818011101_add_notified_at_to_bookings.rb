class AddNotifiedAtToBookings < ActiveRecord::Migration[8.1]
  def change
    add_column :bookings, :notified_at, :datetime
  end
end
