import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { client } from '../api/client'

const PER_PAGE = 25

// Filtering happens server-side (?status=) rather than fetching every
// booking and filtering in the browser -- a business accumulates bookings
// indefinitely, so "just fetch everything" doesn't stay correct or fast.
export function useBookings(businessSlug, status) {
  return useInfiniteQuery({
    queryKey: [ 'bookings', businessSlug, status ],
    queryFn: async ({ pageParam }) => {
      const { data } = await client.get(`/businesses/${businessSlug}/bookings`, {
        params: {
          page: pageParam,
          per_page: PER_PAGE,
          ...(status && status !== 'all' ? { status } : {}),
        },
      })
      return data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.length === PER_PAGE ? allPages.length + 1 : undefined),
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

export function useAcceptBooking(businessSlug) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookingId, idempotencyKey }) => {
      const { data } = await client.post(
        `/businesses/${businessSlug}/bookings/${bookingId}/accept`,
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

export function useDenyBooking(businessSlug) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookingId, reason, idempotencyKey }) => {
      const { data } = await client.post(
        `/businesses/${businessSlug}/bookings/${bookingId}/deny`,
        { booking: { reason } },
        { headers: { 'Idempotency-Key': idempotencyKey } }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ 'bookings', businessSlug ] })
    },
  })
}
