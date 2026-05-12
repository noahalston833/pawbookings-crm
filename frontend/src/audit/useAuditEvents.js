import { useInfiniteQuery } from '@tanstack/react-query'
import { client } from '../api/client'

const PER_PAGE = 25

export function useAuditEvents(businessSlug) {
  return useInfiniteQuery({
    queryKey: [ 'audit_events', businessSlug ],
    queryFn: async ({ pageParam }) => {
      const { data } = await client.get(`/businesses/${businessSlug}/audit_events`, {
        params: { page: pageParam, per_page: PER_PAGE },
      })
      return data
    },
    initialPageParam: 1,
    // The endpoint returns a plain array with no total-count metadata --
    // a short page is the only signal that we've reached the end.
    getNextPageParam: (lastPage, allPages) => (lastPage.length === PER_PAGE ? allPages.length + 1 : undefined),
  })
}
