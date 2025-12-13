module Api
  module V1
    class SessionsController < BaseController
      MAX_ATTEMPTS = 10
      ATTEMPT_WINDOW = 3.minutes

      before_action :enforce_login_rate_limit, only: :create

      def create
        user = User.find_by(email: session_params[:email])

        if user&.authenticate(session_params[:password])
          # Prevents session fixation: a new session id is issued on login
          # rather than reusing whatever session existed pre-authentication.
          reset_session
          session[:user_id] = user.id
          render json: { user: user_json(user) }, status: :ok
        else
          render_error(
            status: :unauthorized,
            code: "invalid_credentials",
            message: "Email or password is incorrect."
          )
        end
      end

      def destroy
        reset_session
        head :no_content
      end

      private

      def session_params
        params.require(:session).permit(:email, :password)
      end

      def user_json(user)
        { id: user.id, email: user.email }
      end

      # A fixed per-IP counter in Rails.cache, not a gem/database table --
      # login throttling doesn't need to survive a process restart to be
      # useful, and this keeps the dependency list small.
      def enforce_login_rate_limit
        key = "rate_limit:login:#{request.remote_ip}"
        attempts = Rails.cache.read(key) || 0

        if attempts >= MAX_ATTEMPTS
          render_error(
            status: :too_many_requests,
            code: "rate_limited",
            message: "Too many login attempts. Please try again later."
          )
          return
        end

        Rails.cache.write(key, attempts + 1, expires_in: ATTEMPT_WINDOW)
      end
    end
  end
end
