import { useMutation, useQueryClient } from '@tanstack/react-query'
import { client } from '../api/client'

export function useBusinessSignup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attributes) => {
      const { data } = await client.post('/business_registrations', { business_registration: attributes })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ 'currentUser' ] })
    },
  })
}
