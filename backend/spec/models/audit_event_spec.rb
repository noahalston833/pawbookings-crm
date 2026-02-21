require 'rails_helper'

RSpec.describe AuditEvent, type: :model do
  it "is valid with a valid factory" do
    expect(build(:audit_event)).to be_valid
  end

  it "requires an action" do
    expect(build(:audit_event, action: nil)).not_to be_valid
  end

  describe ".record!" do
    it "creates a row with the given business, actor, action, target, and metadata" do
      booking = create(:booking)
      actor = create(:user)

      event = described_class.record!(
        business: booking.business, actor: actor, action: "booking.accepted", target: booking, metadata: { note: "ok" }
      )

      expect(event.business).to eq(booking.business)
      expect(event.actor).to eq(actor)
      expect(event.target).to eq(booking)
      expect(event.metadata).to eq({ "note" => "ok" })
    end
  end
end
