import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { client } from '../api/client'

const queryKey = (businessSlug) => [ 'memberships', businessSlug ]

export function useMemberships(businessSlug) {
  return useQuery({
    queryKey: queryKey(businessSlug),
    queryFn: async () => {
      const { data } = await client.get(`/businesses/${businessSlug}/memberships`)
      return data
    },
  })
}

export function useUpdateMembershipRole(businessSlug) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ membershipId, role }) => {
      const { data } = await client.patch(`/businesses/${businessSlug}/memberships/${membershipId}`, {
        membership: { role },
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(businessSlug) })
    },
  })
}

export function useRemoveMembership(businessSlug) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (membershipId) => {
      await client.delete(`/businesses/${businessSlug}/memberships/${membershipId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(businessSlug) })
    },
  })
}
