module Api
  module V1
    module Businesses
      # Tenant-specific signup (POST /businesses/:business_slug/customer_registration).
      # "Creates or associates" a customer membership, but never silently:
      # a brand-new email registers a new user; an email that already has
      # an account must log in first (see docs/tenancy.md) rather than
      # having a membership attached to it without proving ownership.
      class CustomerRegistrationsController < Api::V1::BaseController
        before_action :set_business!

        def create
          if current_user
            join_current_user
          else
            register_new_customer
          end
        end

        private

        def set_business!
          @business = Business.find_by!(slug: params[:business_slug])
        end

        def join_current_user
          if current_user.memberships.exists?(business: @business)
            return render_error(
              status: :unprocessable_content,
              code: "already_a_member",
              message: "You already have access to this business."
            )
          end

          membership = @business.memberships.create!(user: current_user, role: :customer)
          render json: membership_json(membership), status: :created
        end

        def register_new_customer
          if User.exists?(email: customer_params[:email])
            return render_error(
              status: :unprocessable_content,
              code: "email_already_registered",
              message: "An account with this email already exists. Please log in first."
            )
          end

          user = nil
          membership = nil

          ActiveRecord::Base.transaction do
            user = User.create!(email: customer_params[:email], password: customer_params[:password])
            membership = @business.memberships.create!(user: user, role: :customer)
          end

          session[:user_id] = user.id
          render json: membership_json(membership), status: :created
        rescue ActiveRecord::RecordInvalid => e
          render_error(
            status: :unprocessable_content,
            code: "validation_failed",
            message: "The request could not be processed.",
            details: e.record.errors.to_hash
          )
        end

        def customer_params
          params.require(:customer_registration).permit(:email, :password)
        end

        def membership_json(membership)
          {
            id: membership.id,
            role: membership.role,
            business: { slug: @business.slug, name: @business.name }
          }
        end
      end
    end
  end
end
