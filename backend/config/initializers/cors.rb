# Be sure to restart your server when you modify this file.

# CORS is restricted to the configured frontend origin only. Credentials
# (cookies) require an explicit origin here rather than a wildcard.
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch("FRONTEND_ORIGIN", "http://localhost:5173")

    resource "/api/*",
      headers: :any,
      methods: %i[get post patch put delete options],
      credentials: true
  end
end
