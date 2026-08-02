import { useQueries } from '@tanstack/react-query'
import { client } from '../api/client'
import { useServices } from '../services/useServices'

// Combines every service's slots into one list for the Availability
// overview page and the business dashboard's capacity warnings. Reuses
// the same per-service query key as useAvailabilitySlots, so a slot
// created/edited there invalidates this aggregate view too.
export function useAllAvailabilitySlots(businessSlug) {
  const { data: services, isLoading: isLoadingServices, isError: isServicesError } = useServices(businessSlug)

  const slotQueries = useQueries({
    queries: (services ?? []).map((service) => ({
      queryKey: [ 'availability_slots', businessSlug, service.id ],
      queryFn: async () => {
        const { data } = await client.get(
          `/businesses/${businessSlug}/service_offerings/${service.id}/availability_slots`
        )
        return data.map((slot) => ({ ...slot, service }))
      },
      enabled: Boolean(businessSlug && service.id),
    })),
  })

  return {
    services: services ?? [],
    slots: slotQueries.flatMap((query) => query.data ?? []),
    isLoading: isLoadingServices || slotQueries.some((query) => query.isLoading),
    isError: isServicesError || slotQueries.some((query) => query.isError),
  }
}
