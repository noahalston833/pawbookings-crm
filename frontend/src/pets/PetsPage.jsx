import { Link, useParams } from 'react-router-dom'
import { usePets, useArchivePet } from './usePets'

export function PetsPage() {
  const { businessSlug } = useParams()
  const { data: pets, isLoading, isError } = usePets(businessSlug)
  const archivePet = useArchivePet(businessSlug)

  function handleArchive(pet) {
    if (window.confirm(`Archive ${pet.name}? You can't undo this from here.`)) {
      archivePet.mutate(pet.id)
    }
  }

  if (isLoading) return <p>Loading your pets…</p>
  if (isError) return <p role="alert">Something went wrong loading your pets. Please try again.</p>

  return (
    <section>
      <h2>My pets</h2>
      <p>
        <Link to={`/${businessSlug}/pets/new`}>Add a pet</Link>
      </p>
      {pets.length === 0 ? (
        <p>You haven&apos;t added any pets yet.</p>
      ) : (
        <ul>
          {pets.map((pet) => (
            <li key={pet.id}>
              {pet.name} ({pet.breed || pet.species}) — {pet.status}
              {pet.status === 'active' && (
                <button type="button" onClick={() => handleArchive(pet)}>Archive</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
