import PropTypes from 'prop-types'
import { useCurrentMembership } from './useCurrentMembership'

// UX convenience only -- hides dashboard-only pages from roles that
// shouldn't see them day-to-day. The backend's Pundit policies are the
// real authorization boundary and enforce this regardless of what this
// component does.
export function RequireRole({ roles, children }) {
  const membership = useCurrentMembership()

  if (!membership || !roles.includes(membership.role)) {
    return <p role="alert">You don&apos;t have access to this page.</p>
  }

  return children
}

RequireRole.propTypes = {
  roles: PropTypes.arrayOf(PropTypes.string).isRequired,
  children: PropTypes.node.isRequired,
}
