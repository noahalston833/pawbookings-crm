import { useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useCurrentMembership } from '../auth/useCurrentMembership'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { roleLabel } from '../lib/roleLabels'

export function ProfilePage() {
  const { businessSlug } = useParams()
  const { user } = useAuth()
  const membership = useCurrentMembership()

  return (
    <>
      <PageHeader title="Profile" description="Your account details for this business." />
      <SectionCard>
        <dl className="row mb-0">
          <dt className="col-sm-3">Email</dt>
          <dd className="col-sm-9">{user.email}</dd>
          <dt className="col-sm-3">Role</dt>
          <dd className="col-sm-9">{roleLabel(membership?.role)}</dd>
          <dt className="col-sm-3">Business</dt>
          <dd className="col-sm-9 mb-0">{businessSlug}</dd>
        </dl>
      </SectionCard>
      {user.memberships.length > 1 && (
        <SectionCard title="Other businesses">
          <ul className="mb-0">
            {user.memberships
              .filter((entry) => entry.business_slug !== businessSlug)
              .map((entry) => (
                <li key={entry.business_slug}>
                  {entry.business_name} ({roleLabel(entry.role)})
                </li>
              ))}
          </ul>
        </SectionCard>
      )}
    </>
  )
}
