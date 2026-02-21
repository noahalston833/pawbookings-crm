class AuditEvent < ApplicationRecord
  belongs_to :business
  belongs_to :actor, class_name: "User"
  belongs_to :target, polymorphic: true, optional: true

  validates :action, presence: true

  # Centralizes what an audit row looks like so every call site logs the
  # same shape -- metadata is a deliberately small, non-sensitive snapshot
  # (never passwords, tokens, or medication/behavioral free text).
  def self.record!(business:, actor:, action:, target: nil, metadata: {})
    create!(business: business, actor: actor, action: action, target: target, metadata: metadata)
  end
end
