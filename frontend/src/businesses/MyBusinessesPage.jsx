import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function MyBusinessesPage() {
  const { user, logout } = useAuth()

  return (
    <main>
      <h1>Your businesses</h1>
      {user.memberships.length === 0 ? (
        <p>You don&apos;t belong to any business yet.</p>
      ) : (
        <ul>
          {user.memberships.map((membership) => (
            <li key={membership.business_slug}>
              <Link to={`/${membership.business_slug}`}>{membership.business_name}</Link> ({membership.role})
            </li>
          ))}
        </ul>
      )}
      <p>
        <Link to="/signup">Register a new business</Link>
      </p>
      <button type="button" onClick={() => logout()}>Log out</button>
    </main>
  )
}
