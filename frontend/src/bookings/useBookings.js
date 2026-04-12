import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { client } from '../api/client'

export function useBookings(businessSlug) {
  return useQuery({
    queryKey: [ 'bookings', businessSlug ],
    queryFn: async () => {
      const { data } = await client.get(`/businesses/${businessSlug}/bookings`)
      return data
    },
  })
}

export function useCreateBooking(businessSlug) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ attributes, idempotencyKey }) => {
      const { data } = await client.post(
        `/businesses/${businessSlug}/bookings`,
        { booking: attributes },
        { headers: { 'Idempotency-Key': idempotencyKey } }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ 'bookings', businessSlug ] })
    },
  })
}

export function useCancelBooking(businessSlug) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookingId, idempotencyKey }) => {
      const { data } = await client.post(
        `/businesses/${businessSlug}/bookings/${bookingId}/cancel`,
        {},
        { headers: { 'Idempotency-Key': idempotencyKey } }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ 'bookings', businessSlug ] })
    },
  })
}
