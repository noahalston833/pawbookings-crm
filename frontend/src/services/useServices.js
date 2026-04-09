import { useQuery } from '@tanstack/react-query'
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
