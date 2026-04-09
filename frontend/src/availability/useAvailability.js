import { useQuery } from '@tanstack/react-query'
import { client } from '../api/client'

export function useAvailability(businessSlug, serviceOfferingId) {
  return useQuery({
    queryKey: [ 'availability', businessSlug, serviceOfferingId ],
    queryFn: async () => {
      const { data } = await client.get(`/businesses/${businessSlug}/service_offerings/${serviceOfferingId}/availability`)
      return data
    },
    enabled: Boolean(businessSlug && serviceOfferingId),
  })
}
