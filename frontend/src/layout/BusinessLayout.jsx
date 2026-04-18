import { Link, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useBusiness } from '../businesses/useBusiness'

export function BusinessLayout() {
  const { businessSlug } = useParams()
  const { user, logout } = useAuth()
  const { data: business } = useBusiness(businessSlug)
  const membership = user.memberships.find((entry) => entry.business_slug === businessSlug)

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
            <li><Link to={`/${businessSlug}/pets`}>My pets</Link></li>
            <li><Link to={`/${businessSlug}/bookings`}>My bookings</Link></li>
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
