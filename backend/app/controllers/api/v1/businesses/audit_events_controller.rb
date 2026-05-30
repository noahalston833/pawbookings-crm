module Api
  module V1
    module Businesses
      class AuditEventsController < Api::V1::TenantScopedController
        def index
          authorize AuditEvent, :index?

          # event_json only reads target_type/target_id (plain columns on
          # audit_events itself), never the polymorphic :target association
          # -- eager loading it would be pure waste (and Bullet agrees).
          events = paginate(
            Current.business.audit_events.includes(:actor).order(created_at: :desc)
          )
          render json: events.map { |event| event_json(event) }
        end

        private

        def event_json(event)
          {
            id: event.id,
            action: event.action,
            actor: { id: event.actor.id, email: event.actor.email },
            target_type: event.target_type,
            target_id: event.target_id,
            metadata: event.metadata,
            created_at: event.created_at
          }
        end
      end
    end
  end
end
