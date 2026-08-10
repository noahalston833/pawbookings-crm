import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { useCurrentMembership } from '../auth/useCurrentMembership'
import { useMemberships, useRemoveMembership, useUpdateMembershipRole } from './useMemberships'
import { getApiError } from '../api/client'
import { useToast } from '../components/ToastContext'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { ResponsiveTable } from '../components/ResponsiveTable'
import { EmptyState } from '../components/EmptyState'
import { LoadingState } from '../components/LoadingState'
import { ErrorAlert } from '../components/ErrorAlert'
import { ConfirmationModal } from '../components/ConfirmationModal'
import { ALL_ROLES, roleLabel } from '../lib/roleLabels'

export function MembershipsPage() {
  const { businessSlug } = useParams()
  const viewerMembership = useCurrentMembership()
  const isOwner = viewerMembership?.role === 'owner'
  const { showToast } = useToast()

  const { data: memberships, isLoading, isError } = useMemberships(businessSlug)
  const updateRole = useUpdateMembershipRole(businessSlug)
  const removeMembership = useRemoveMembership(businessSlug)
  const [ membershipToRemove, setMembershipToRemove ] = useState(null)

  function handleRoleChange(membership, role) {
    updateRole.mutate({ membershipId: membership.id, role }, { onSuccess: () => showToast('Role updated') })
  }

  function confirmRemove() {
    removeMembership.mutate(membershipToRemove.id, {
      onSuccess: () => {
        showToast('Member removed')
        setMembershipToRemove(null)
      },
    })
  }

  if (isLoading) return <LoadingState label="Loading members…" />
  if (isError) return <ErrorAlert message="Something went wrong loading members. Please try again." />

  const error = [ updateRole.error, removeMembership.error ].map((mutationError) => mutationError && getApiError(mutationError)).find(Boolean)

  return (
    <>
      <PageHeader
        title="Team"
        description="An admin cannot change or remove an owner's membership, and cannot grant owner access -- only an owner can. The last owner of a business can never be removed or demoted."
      />
      {error && <div className="mb-3"><ErrorAlert error={error} /></div>}

      {memberships.length === 0 ? (
        <SectionCard>
          <EmptyState title="No members" description="No members found." />
        </SectionCard>
      ) : (
        <SectionCard>
          <ResponsiveTable>
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col" className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {memberships.map((membership) => {
                // Admins can't touch an owner's membership at all (see
                // MembershipPolicy) -- render those rows read-only rather
                // than offer controls the server will reject anyway.
                const canModifyRow = isOwner || membership.role !== 'owner'
                const roleOptions = isOwner ? ALL_ROLES : ALL_ROLES.filter((role) => role !== 'owner')

                return (
                  <tr key={membership.id}>
                    <td>{membership.user.email}</td>
                    <td style={{ maxWidth: '10rem' }}>
                      {canModifyRow ? (
                        <>
                          <Form.Label htmlFor={`role-${membership.id}`} visuallyHidden>Role</Form.Label>
                          <Form.Select
                            id={`role-${membership.id}`}
                            size="sm"
                            value={membership.role}
                            disabled={updateRole.isPending}
                            onChange={(event) => handleRoleChange(membership, event.target.value)}
                          >
                            {roleOptions.map((role) => (
                              <option key={role} value={role}>{roleLabel(role)}</option>
                            ))}
                          </Form.Select>
                        </>
                      ) : (
                        <strong>{roleLabel(membership.role)}</strong>
                      )}
                    </td>
                    <td className="text-end">
                      {canModifyRow && (
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => setMembershipToRemove(membership)}
                          disabled={removeMembership.isPending}
                        >
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </ResponsiveTable>
        </SectionCard>
      )}

      <ConfirmationModal
        show={membershipToRemove !== null}
        title="Remove member"
        body={`Remove ${membershipToRemove?.user.email} from this business?`}
        confirmLabel="Remove"
        confirmVariant="danger"
        onConfirm={confirmRemove}
        onCancel={() => setMembershipToRemove(null)}
        isConfirming={removeMembership.isPending}
      />
    </>
  )
}

