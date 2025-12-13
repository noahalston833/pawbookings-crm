class ApplicationController < ActionController::API
  include ActionController::RequestForgeryProtection
  include ErrorHandling

  protect_from_forgery with: :exception

  # ActionController::API doesn't run the on_load(:action_controller) hook
  # that normally copies config.action_controller.allow_forgery_protection
  # onto the controller class, so it's synced explicitly (each environment
  # sets the config value explicitly -- see config/environments/*.rb).
  self.allow_forgery_protection = Rails.application.config.action_controller.allow_forgery_protection

  before_action :set_current_user

  private

  def set_current_user
    Current.user = User.find_by(id: session[:user_id])
  end

  def current_user
    Current.user
  end

  def authenticate_user!
    return if current_user

    render_error(
      status: :unauthorized,
      code: "authentication_required",
      message: "You must be logged in to do that."
    )
  end
end
