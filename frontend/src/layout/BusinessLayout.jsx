import { Link, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useCurrentMembership } from '../auth/useCurrentMembership'
import { useBusiness } from '../businesses/useBusiness'

export function BusinessLayout() {
  const { businessSlug } = useParams()
  const { user, logout } = useAuth()
  const { data: business } = useBusiness(businessSlug)
  const membership = useCurrentMembership()
  const isOwnerOrAdmin = [ 'owner', 'admin' ].includes(membership?.role)

  return (
    <div>
      <header>
        <p>
          <Link to="/">All businesses</Link>
        </p>
        <h1>{business?.name ?? businessSlug}</h1>
        <nav aria-label="Business navigation">
          <ul>
            <li><Link to={`/${businessSlug}/services`}>Services</Link></li>
            <li><Link to={`/${businessSlug}/pets`}>Pets</Link></li>
            <li><Link to={`/${businessSlug}/bookings`}>Bookings</Link></li>
            {isOwnerOrAdmin && (
              <>
                <li><Link to={`/${businessSlug}/members`}>Members</Link></li>
                <li><Link to={`/${businessSlug}/audit-log`}>Audit log</Link></li>
              </>
            )}
            {membership?.role === 'owner' && (
              <li><Link to={`/${businessSlug}/settings`}>Settings</Link></li>
            )}
          </ul>
        </nav>
        <p>
          {user.email} ({membership?.role})
          {' '}
          <button type="button" onClick={() => logout()}>Log out</button>
        </p>
      </header>
      <Outlet />
    </div>
  )
}
