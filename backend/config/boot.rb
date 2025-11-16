ENV["BUNDLE_GEMFILE"] ||= File.expand_path("../Gemfile", __dir__)

require "bundler/setup" # Set up gems listed in the Gemfile.

# Dev/test config lives in one .env at the monorepo root (shared with
# docker-compose.yml) instead of per-app, so both apps agree on DB
# credentials. Never required in production: that env reads real
# platform-provided environment variables instead.
if ENV.fetch("RAILS_ENV", "development") != "production"
  require "dotenv"
  Dotenv.load(File.expand_path("../../.env", __dir__))
end
