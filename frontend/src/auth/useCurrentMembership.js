import { useParams } from 'react-router-dom'
import { useAuth } from './AuthContext'

// Every dashboard-ish page needs "what is my role in THIS business" --
// centralized here so it's derived the same way everywhere rather than
// re-deriving `user.memberships.find(...)` in each component.
export function useCurrentMembership() {
  const { businessSlug } = useParams()
  const { user } = useAuth()

  return user?.memberships.find((membership) => membership.business_slug === businessSlug) ?? null
}
