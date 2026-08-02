import { useQueries } from '@tanstack/react-query'
import { client } from '../api/client'
import { useServices } from '../services/useServices'

// Fans out one request per active service to the PUBLIC availability
// endpoint (same one BookingRequestPage uses, and the same query key
// shape as the single-service useAvailability hook, so caches are
// shared rather than duplicated). Unlike the admin-facing
// useAllAvailabilitySlots, these slots include a real computed
// remaining_capacity (accepted-booking count subtracted server-side)
// and are already filtered to active/future -- useful for anything
// that needs to reason about "how full is this," not just manage slots.
export function usePublicAvailability(businessSlug, { enabled = true } = {}) {
  const { data: services, isLoading: isLoadingServices, isError: isServicesError } = useServices(businessSlug)
  const activeServices = enabled ? (services ?? []).filter((service) => service.active) : []

  const queries = useQueries({
    queries: activeServices.map((service) => ({
      queryKey: [ 'availability', businessSlug, service.id ],
      queryFn: async () => {
        const { data } = await client.get(`/businesses/${businessSlug}/service_offerings/${service.id}/availability`)
        return data
      },
      enabled: enabled && Boolean(businessSlug && service.id),
    })),
  })

  const slots = activeServices.flatMap((service, index) => {
    const data = queries[index]?.data
    return (data?.slots ?? []).map((slot) => ({ ...slot, active: true, service }))
  })

  return {
    services: activeServices,
    slots,
    isLoading: isLoadingServices || queries.some((query) => query.isLoading),
    isError: isServicesError || queries.some((query) => query.isError),
  }
}
