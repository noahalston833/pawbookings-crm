import { useMutation, useQueryClient } from '@tanstack/react-query'
import { client } from '../api/client'

export function useCustomerRegistration(businessSlug) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attributes) => {
      const { data } = await client.post(
        `/businesses/${businessSlug}/customer_registration`,
        { customer_registration: attributes }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ 'currentUser' ] })
    },
  })
}
