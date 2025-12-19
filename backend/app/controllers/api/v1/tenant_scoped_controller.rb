module Api
  module V1
    # Parent for every endpoint scoped to one business
    # (/api/v1/businesses/:business_slug/...). Resolves the tenant and the
    # caller's membership in it *before* any action runs, and rejects both
    # "business doesn't exist" and "business exists but you're not a member"
    # with the same 404 -- a 403 would confirm the business exists to
    # someone who has no business knowing that (see docs/tenancy.md).
    class TenantScopedController < BaseController
      before_action :authenticate_user!
      before_action :set_current_business!

      private

      def set_current_business!
        business = Business.find_by(slug: params[:business_slug])
        raise ActiveRecord::RecordNotFound unless business

        membership = current_user.memberships.find_by(business: business)
        raise ActiveRecord::RecordNotFound unless membership

        Current.business = business
        Current.membership = membership
      end
    end
  end
end
