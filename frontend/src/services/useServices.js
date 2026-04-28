import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { client } from '../api/client'

export function useServices(businessSlug) {
  return useQuery({
    queryKey: [ 'service_offerings', businessSlug ],
    queryFn: async () => {
      const { data } = await client.get(`/businesses/${businessSlug}/service_offerings`)
      return data
    },
  })
}

export function useServiceOffering(businessSlug, serviceOfferingId) {
  return useQuery({
    queryKey: [ 'service_offerings', businessSlug, serviceOfferingId ],
    queryFn: async () => {
      const { data } = await client.get(`/businesses/${businessSlug}/service_offerings/${serviceOfferingId}`)
      return data
    },
    enabled: Boolean(businessSlug && serviceOfferingId),
  })
}

export function useCreateService(businessSlug) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attributes) => {
      const { data } = await client.post(`/businesses/${businessSlug}/service_offerings`, {
        service_offering: attributes,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ 'service_offerings', businessSlug ] })
    },
  })
}

export function useUpdateService(businessSlug, serviceOfferingId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attributes) => {
      const { data } = await client.patch(
        `/businesses/${businessSlug}/service_offerings/${serviceOfferingId}`,
        { service_offering: attributes }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ 'service_offerings', businessSlug ] })
    },
  })
}
