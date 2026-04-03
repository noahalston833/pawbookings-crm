import { useQuery } from '@tanstack/react-query'
import { client } from '../api/client'

export function useBusiness(businessSlug) {
  return useQuery({
    queryKey: [ 'business', businessSlug ],
    queryFn: async () => {
      const { data } = await client.get(`/businesses/${businessSlug}`)
      return data
    },
    enabled: Boolean(businessSlug),
  })
}
