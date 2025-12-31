module Api
  module V1
    module Businesses
      class PetsController < Api::V1::TenantScopedController
        def index
          pets = policy_scope(Current.business.pets).includes(:user).order(:id)
          render json: pets.map { |pet| pet_json(pet) }
        end

        def show
          pet = Current.business.pets.find(params[:id])
          authorize pet
          render json: pet_json(pet)
        end

        def create
          pet = Current.business.pets.new(pet_params)
          pet.user = current_user
          authorize pet

          if pet.save
            render json: pet_json(pet), status: :created
          else
            render_error(
              status: :unprocessable_content,
              code: "validation_failed",
              message: "The request could not be processed.",
              details: pet.errors.to_hash
            )
          end
        end

        def update
          pet = Current.business.pets.find(params[:id])
          authorize pet

          if pet.update(pet_params)
            render json: pet_json(pet)
          else
            render_error(
              status: :unprocessable_content,
              code: "validation_failed",
              message: "The request could not be processed.",
              details: pet.errors.to_hash
            )
          end
        end

        private

        def pet_params
          params.require(:pet).permit(
            :name, :species, :breed, :birth_date, :weight, :sex,
            :vaccination_status, :vaccination_expires_on,
            :feeding_instructions, :medication_instructions,
            :behavioral_notes, :emergency_notes, :status
          )
        end

        def pet_json(pet)
          {
            id: pet.id,
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            birth_date: pet.birth_date,
            weight: pet.weight,
            sex: pet.sex,
            vaccination_status: pet.vaccination_status,
            vaccination_expires_on: pet.vaccination_expires_on,
            feeding_instructions: pet.feeding_instructions,
            medication_instructions: pet.medication_instructions,
            behavioral_notes: pet.behavioral_notes,
            emergency_notes: pet.emergency_notes,
            status: pet.status,
            owner: { id: pet.user.id, email: pet.user.email }
          }
        end
      end
    end
  end
end
