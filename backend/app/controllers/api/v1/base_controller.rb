module Api
  module V1
    # Shared parent for all versioned API controllers. Tenant-scoped
    # controllers get their own base (Api::V1::TenantScopedController, added
    # with tenant resolution) that inherits from this one.
    class BaseController < ApplicationController
      include Paginatable
    end
  end
end
