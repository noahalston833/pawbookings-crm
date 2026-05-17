import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { client } from '../api/client'

const queryKey = (businessSlug) => [ 'business_settings', businessSlug ]

export function useBusinessSettings(businessSlug) {
  return useQuery({
    queryKey: queryKey(businessSlug),
    queryFn: async () => {
      const { data } = await client.get(`/businesses/${businessSlug}/business_settings`)
      return data
    },
  })
}

export function useUpdateBusinessSettings(businessSlug) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attributes) => {
      const { data } = await client.patch(`/businesses/${businessSlug}/business_settings`, {
        business: attributes,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(businessSlug) })
      // The public business lookup (name shown in the layout header) is
      // a different cache entry and won't otherwise learn about a rename.
      queryClient.invalidateQueries({ queryKey: [ 'business', businessSlug ] })
    },
  })
}
