import { Link, useParams } from 'react-router-dom'
import { usePets, useArchivePet } from './usePets'
import { useCurrentMembership } from '../auth/useCurrentMembership'

export function PetsPage() {
  const { businessSlug } = useParams()
  const membership = useCurrentMembership()
  const isStaffOrAbove = Boolean(membership && [ 'owner', 'admin', 'staff' ].includes(membership.role))
  const canArchive = Boolean(membership && membership.role !== 'staff')
  const { data: pets, isLoading, isError } = usePets(businessSlug)
  const archivePet = useArchivePet(businessSlug)

  function handleArchive(pet) {
    if (window.confirm(`Archive ${pet.name}? You can't undo this from here.`)) {
      archivePet.mutate(pet.id)
    }
  }

  if (isLoading) return <p>Loading pets…</p>
  if (isError) return <p role="alert">Something went wrong loading pets. Please try again.</p>

  return (
    <section>
      <h2>{isStaffOrAbove ? 'Pet directory' : 'My pets'}</h2>
      {!isStaffOrAbove && (
        <p>
          <Link to={`/${businessSlug}/pets/new`}>Add a pet</Link>
        </p>
      )}
      {pets.length === 0 ? (
        <p>{isStaffOrAbove ? 'No pets have been registered yet.' : 'You haven\u2019t added any pets yet.'}</p>
      ) : (
        <ul>
          {pets.map((pet) => (
            <li key={pet.id}>
              {pet.name} ({pet.breed || pet.species}) — {pet.status}
              {isStaffOrAbove && <> — owner: {pet.owner.email}</>}
              {pet.status === 'active' && canArchive && (
                <button type="button" onClick={() => handleArchive(pet)}>Archive</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
