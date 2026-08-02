import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { client } from '../api/client'

const listKey = (businessSlug) => [ 'pets', businessSlug ]

export function usePets(businessSlug) {
  return useQuery({
    queryKey: listKey(businessSlug),
    queryFn: async () => {
      const { data } = await client.get(`/businesses/${businessSlug}/pets`)
      return data
    },
  })
}

export function usePet(businessSlug, petId) {
  return useQuery({
    queryKey: [ 'pets', businessSlug, petId ],
    queryFn: async () => {
      const { data } = await client.get(`/businesses/${businessSlug}/pets/${petId}`)
      return data
    },
    enabled: Boolean(businessSlug && petId),
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
      queryClient.invalidateQueries({ queryKey: listKey(businessSlug) })
    },
  })
}

export function useUpdatePet(businessSlug, petId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attributes) => {
      const { data } = await client.patch(`/businesses/${businessSlug}/pets/${petId}`, { pet: attributes })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKey(businessSlug) })
      queryClient.invalidateQueries({ queryKey: [ 'pets', businessSlug, petId ] })
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
      queryClient.invalidateQueries({ queryKey: listKey(businessSlug) })
    },
  })
}
