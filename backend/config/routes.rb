Rails.application.routes.draw do
  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resource :csrf_token, only: :show, controller: "csrf_tokens"
      resource :session, only: %i[create destroy]
      resources :business_registrations, only: :create

      resources :businesses, only: [], param: :slug do
        scope module: :businesses do
          resource :customer_registration, only: :create
          resources :memberships, only: %i[index update destroy]
          resources :pets, only: %i[index show create update]
          resources :service_offerings, only: %i[index show create update] do
            resources :availability_slots, only: %i[index show create update]
            get :availability, on: :member, to: "availabilities#index"
          end
          resources :bookings, only: %i[index show create] do
            post :accept, on: :member
            post :deny, on: :member
            post :cancel, on: :member
          end
        end
      end
    end
  end
end
