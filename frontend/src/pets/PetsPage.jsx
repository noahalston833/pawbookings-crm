import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import Button from 'react-bootstrap/Button'
import { usePets, useArchivePet } from './usePets'
import { useCurrentMembership } from '../auth/useCurrentMembership'
import { useToast } from '../components/ToastContext'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { ResponsiveTable } from '../components/ResponsiveTable'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { LoadingState } from '../components/LoadingState'
import { ErrorAlert } from '../components/ErrorAlert'
import { ConfirmationModal } from '../components/ConfirmationModal'
import { formatAge, vaccinationExpiryWarning } from '../lib/dateTime'

export function PetsPage() {
  const { businessSlug } = useParams()
  const membership = useCurrentMembership()
  const isStaffOrAbove = Boolean(membership && [ 'owner', 'admin', 'staff' ].includes(membership.role))
  const canArchive = Boolean(membership && membership.role !== 'staff')
  const { data: pets, isLoading, isError } = usePets(businessSlug)
  const archivePet = useArchivePet(businessSlug)
  const { showToast } = useToast()
  const [ petToArchive, setPetToArchive ] = useState(null)

  function confirmArchive() {
    archivePet.mutate(petToArchive.id, {
      onSuccess: () => {
        showToast('Pet archived')
        setPetToArchive(null)
      },
    })
  }

  if (isLoading) return <LoadingState label="Loading pets…" />
  if (isError) return <ErrorAlert message="Something went wrong loading pets. Please try again." />

  const title = isStaffOrAbove ? 'Pet directory' : 'My Pets'
  const description = isStaffOrAbove
    ? 'Every pet registered at this business.'
    : 'Manage pet profiles used when requesting services.'

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        action={!isStaffOrAbove && (
          <Button as={Link} to={`/${businessSlug}/pets/new`} variant="primary">Add Pet</Button>
        )}
      />

      {pets.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="No pets added yet"
            description={isStaffOrAbove ? 'No pets have been registered yet.' : 'Add your first pet before requesting a service.'}
            action={!isStaffOrAbove && (
              <Button as={Link} to={`/${businessSlug}/pets/new`} variant="primary">Add Pet</Button>
            )}
          />
        </SectionCard>
      ) : (
        <>
          {/* Cards on small screens */}
          <div className="d-md-none d-flex flex-column gap-3">
            {pets.map((pet) => (
              <SectionCard key={pet.id} className="mb-0">
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <div>
                    <p className="mb-0 fw-semibold">{pet.name}</p>
                    <p className="mb-0 text-muted small">{pet.breed || 'Mixed breed'}</p>
                  </div>
                  <StatusBadge label={pet.status === 'active' ? 'Active' : 'Archived'} variant={pet.status === 'active' ? 'success' : 'secondary'} />
                </div>
                {isStaffOrAbove && <p className="mb-1 small text-muted">Owner: {pet.owner.email}</p>}
                {pet.birth_date && <p className="mb-1 small">Age: {formatAge(pet.birth_date)}</p>}
                <p className="mb-2 small">
                  Vaccination: {pet.vaccination_status.replaceAll('_', ' ')}
                  {vaccinationExpiryWarning(pet) && (
                    <span className="text-danger"> — {vaccinationExpiryWarning(pet)}</span>
                  )}
                </p>
                <div className="d-flex gap-2">
                  <Button as={Link} to={`/${businessSlug}/pets/${pet.id}/edit`} size="sm" variant="outline-secondary">
                    View
                  </Button>
                  {pet.status === 'active' && canArchive && (
                    <Button size="sm" variant="outline-danger" onClick={() => setPetToArchive(pet)}>
                      Archive
                    </Button>
                  )}
                </div>
              </SectionCard>
            ))}
          </div>

          {/* Table on medium+ screens */}
          <SectionCard className="d-none d-md-block">
            <ResponsiveTable>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Breed</th>
                  <th scope="col">Age</th>
                  {isStaffOrAbove && <th scope="col">Owner</th>}
                  <th scope="col">Vaccination</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {pets.map((pet) => (
                  <tr key={pet.id}>
                    <td>{pet.name}</td>
                    <td>{pet.breed || 'Mixed breed'}</td>
                    <td>{formatAge(pet.birth_date) ?? '—'}</td>
                    {isStaffOrAbove && <td>{pet.owner.email}</td>}
                    <td>
                      <span className="text-capitalize">{pet.vaccination_status.replaceAll('_', ' ')}</span>
                      {vaccinationExpiryWarning(pet) && (
                        <div className="text-danger small">{vaccinationExpiryWarning(pet)}</div>
                      )}
                    </td>
                    <td>
                      <StatusBadge label={pet.status === 'active' ? 'Active' : 'Archived'} variant={pet.status === 'active' ? 'success' : 'secondary'} />
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <Button as={Link} to={`/${businessSlug}/pets/${pet.id}/edit`} size="sm" variant="outline-secondary">
                          View
                        </Button>
                        {pet.status === 'active' && canArchive && (
                          <Button size="sm" variant="outline-danger" onClick={() => setPetToArchive(pet)}>
                            Archive
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </ResponsiveTable>
          </SectionCard>
        </>
      )}

      <ConfirmationModal
        show={petToArchive !== null}
        title="Archive pet"
        body={`Archive ${petToArchive?.name}? You can't undo this from here.`}
        confirmLabel="Archive"
        confirmVariant="danger"
        onConfirm={confirmArchive}
        onCancel={() => setPetToArchive(null)}
        isConfirming={archivePet.isPending}
      />
    </>
  )
}
