import { useParams } from 'react-router-dom'
import { useCurrentMembership } from '../auth/useCurrentMembership'
import { useMemberships, useRemoveMembership, useUpdateMembershipRole } from './useMemberships'
import { getApiError } from '../api/client'
import { ApiErrorAlert } from '../components/ApiErrorAlert'

const ALL_ROLES = [ 'owner', 'admin', 'staff', 'customer' ]

export function MembershipsPage() {
  const { businessSlug } = useParams()
  const viewerMembership = useCurrentMembership()
  const isOwner = viewerMembership?.role === 'owner'

  const { data: memberships, isLoading, isError } = useMemberships(businessSlug)
  const updateRole = useUpdateMembershipRole(businessSlug)
  const removeMembership = useRemoveMembership(businessSlug)

  function handleRoleChange(membership, role) {
    updateRole.mutate({ membershipId: membership.id, role })
  }

  function handleRemove(membership) {
    if (!window.confirm(`Remove ${membership.user.email} from this business?`)) return

    removeMembership.mutate(membership.id)
  }

  if (isLoading) return <p>Loading members…</p>
  if (isError) return <p role="alert">Something went wrong loading members. Please try again.</p>

  const error = [ updateRole.error, removeMembership.error ].map((mutationError) => mutationError && getApiError(mutationError)).find(Boolean)

  return (
    <section>
      <h2>Members</h2>
      <p>
        An admin cannot change or remove an owner&apos;s membership, and cannot grant owner access -- only
        an owner can. The last owner of a business can never be removed or demoted.
      </p>
      {error && <ApiErrorAlert error={error} />}
      {memberships.length === 0 ? (
        <p>No members found.</p>
      ) : (
        <ul>
          {memberships.map((membership) => {
            // Admins can't touch an owner's membership at all (see
            // MembershipPolicy) -- render those rows read-only rather
            // than offer controls the server will reject anyway.
            const canModifyRow = isOwner || membership.role !== 'owner'
            const roleOptions = isOwner ? ALL_ROLES : ALL_ROLES.filter((role) => role !== 'owner')

            return (
              <li key={membership.id}>
                {membership.user.email}
                {' — '}
                {canModifyRow ? (
                  <>
                    <label htmlFor={`role-${membership.id}`}>Role</label>
                    {' '}
                    <select
                      id={`role-${membership.id}`}
                      value={membership.role}
                      disabled={updateRole.isPending}
                      onChange={(event) => handleRoleChange(membership, event.target.value)}
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    {' '}
                    <button type="button" onClick={() => handleRemove(membership)} disabled={removeMembership.isPending}>
                      Remove
                    </button>
                  </>
                ) : (
                  <strong>{membership.role}</strong>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
