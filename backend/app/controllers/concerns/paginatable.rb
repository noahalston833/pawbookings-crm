# Plain limit/offset pagination -- no kaminari/will_paginate dependency
# for something this simple. Shared so every list endpoint honors the
# same page/per_page params consistently.
module Paginatable
  extend ActiveSupport::Concern

  DEFAULT_PER_PAGE = 25
  MAX_PER_PAGE = 100

  private

  def paginate(scope)
    scope.limit(per_page).offset((page - 1) * per_page)
  end

  def page
    [ params[:page].to_i, 1 ].max
  end

  def per_page
    requested = params[:per_page].to_i
    requested.positive? ? [ requested, MAX_PER_PAGE ].min : DEFAULT_PER_PAGE
  end
end
