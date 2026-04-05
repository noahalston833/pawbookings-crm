import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { client } from '../api/client'

export function usePets(businessSlug) {
  return useQuery({
    queryKey: [ 'pets', businessSlug ],
    queryFn: async () => {
      const { data } = await client.get(`/businesses/${businessSlug}/pets`)
      return data
    },
  })
}

export function useCreatePet(businessSlug) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attributes) => {
      const { data } = await client.post(`/businesses/${businessSlug}/pets`, { pet: attributes })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ 'pets', businessSlug ] })
    },
  })
}

export function useArchivePet(businessSlug) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (petId) => {
      const { data } = await client.patch(`/businesses/${businessSlug}/pets/${petId}`, {
        pet: { status: 'archived' },
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ 'pets', businessSlug ] })
    },
  })
}
