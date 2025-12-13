# Every error response uses one JSON shape so frontend error handling and
# logging don't need per-endpoint special cases:
#   { "error": { "code", "message", "details", "request_id" } }
module ErrorHandling
  extend ActiveSupport::Concern

  included do
    rescue_from StandardError, with: :render_unexpected_error
    rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :render_validation_error
    rescue_from ActionController::ParameterMissing, with: :render_bad_request
    rescue_from ActionController::InvalidAuthenticityToken, with: :render_invalid_csrf_token
  end

  private

  def render_error(status:, code:, message:, details: {})
    render status: status, json: {
      error: {
        code: code,
        message: message,
        details: details,
        request_id: request.request_id
      }
    }
  end

  def render_not_found(_exception = nil)
    render_error(
      status: :not_found,
      code: "not_found",
      message: "The requested resource was not found."
    )
  end

  def render_validation_error(exception)
    render_error(
      status: :unprocessable_content,
      code: "validation_failed",
      message: "The request could not be processed.",
      details: exception.record.errors.to_hash
    )
  end

  def render_bad_request(exception)
    render_error(status: :bad_request, code: "bad_request", message: exception.message)
  end

  def render_invalid_csrf_token(_exception)
    render_error(
      status: :unprocessable_content,
      code: "invalid_csrf_token",
      message: "Your session expired or the request could not be verified. Please refresh and try again."
    )
  end

  # Never leaks the exception message/backtrace to the client -- only to
  # the server log, tagged with the request id so the two can be matched.
  def render_unexpected_error(exception)
    Rails.logger.error(
      "request_id=#{request.request_id} unexpected_error=#{exception.class} message=#{exception.message}"
    )
    render_error(
      status: :internal_server_error,
      code: "internal_error",
      message: "An unexpected error occurred."
    )
  end
end
