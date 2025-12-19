module Api
  module V1
    module Businesses
      class MembershipsController < Api::V1::TenantScopedController
        def index
          authorize Membership, :index?

          memberships = Current.business.memberships.includes(:user).order(:id)
          render json: memberships.map { |membership| membership_json(membership) }
        end

        def update
          membership = Current.business.memberships.find(params[:id])
          membership.assign_attributes(membership_params)
          authorize membership

          if membership.save
            render json: membership_json(membership)
          else
            render_error(
              status: :unprocessable_content,
              code: "validation_failed",
              message: "The request could not be processed.",
              details: membership.errors.to_hash
            )
          end
        end

        def destroy
          membership = Current.business.memberships.find(params[:id])
          authorize membership

          if membership.destroy
            head :no_content
          else
            render_error(
              status: :unprocessable_content,
              code: "validation_failed",
              message: membership.errors.full_messages.to_sentence,
              details: membership.errors.to_hash
            )
          end
        end

        private

        def membership_params
          params.require(:membership).permit(:role)
        end

        def membership_json(membership)
          {
            id: membership.id,
            role: membership.role,
            user: { id: membership.user.id, email: membership.user.email }
          }
        end
      end
    end
  end
end
