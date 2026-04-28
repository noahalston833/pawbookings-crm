import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { client } from '../api/client'

const queryKey = (businessSlug, serviceOfferingId) => [ 'availability_slots', businessSlug, serviceOfferingId ]

// Management view of a service's slots (capacity/active, no
// remaining_capacity) -- distinct from useAvailability.js, which is the
// customer-facing booking endpoint.
export function useAvailabilitySlots(businessSlug, serviceOfferingId) {
  return useQuery({
    queryKey: queryKey(businessSlug, serviceOfferingId),
    queryFn: async () => {
      const { data } = await client.get(
        `/businesses/${businessSlug}/service_offerings/${serviceOfferingId}/availability_slots`
      )
      return data
    },
    enabled: Boolean(businessSlug && serviceOfferingId),
  })
}

export function useCreateAvailabilitySlot(businessSlug, serviceOfferingId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attributes) => {
      const { data } = await client.post(
        `/businesses/${businessSlug}/service_offerings/${serviceOfferingId}/availability_slots`,
        { availability_slot: attributes }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(businessSlug, serviceOfferingId) })
    },
  })
}

export function useUpdateAvailabilitySlot(businessSlug, serviceOfferingId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ slotId, attributes }) => {
      const { data } = await client.patch(
        `/businesses/${businessSlug}/service_offerings/${serviceOfferingId}/availability_slots/${slotId}`,
        { availability_slot: attributes }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(businessSlug, serviceOfferingId) })
    },
  })
}
