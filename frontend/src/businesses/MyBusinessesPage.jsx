import { Link } from 'react-router-dom'
import Button from 'react-bootstrap/Button'
import { useAuth } from '../auth/AuthContext'
import { AppShell } from '../components/AppShell'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { ResponsiveTable } from '../components/ResponsiveTable'
import { EmptyState } from '../components/EmptyState'
import { roleLabel } from '../lib/roleLabels'

export function MyBusinessesPage() {
  const { user, logout } = useAuth()

  return (
    <AppShell homeTo="/" navItems={[]} userEmail={user.email} onLogout={() => logout()}>
      <PageHeader
        title="Your Businesses"
        action={<Button as={Link} to="/signup" variant="primary">Register a New Business</Button>}
      />

      {user.memberships.length === 0 ? (
        <SectionCard>
          <EmptyState title="No businesses yet" description="You don't belong to any business yet." />
        </SectionCard>
      ) : (
        <SectionCard>
          <ResponsiveTable>
            <thead>
              <tr>
                <th scope="col">Business</th>
                <th scope="col">Your role</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {user.memberships.map((membership) => (
                <tr key={membership.business_slug}>
                  <td>{membership.business_name}</td>
                  <td>{roleLabel(membership.role)}</td>
                  <td className="text-end">
                    <Button as={Link} to={`/${membership.business_slug}`} size="sm" variant="outline-secondary">
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        </SectionCard>
      )}
    </AppShell>
  )
}

