import { useParams } from 'react-router-dom'
import { useMemberships } from '../memberships/useMemberships'
import { usePets } from '../pets/usePets'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { ResponsiveTable } from '../components/ResponsiveTable'
import { EmptyState } from '../components/EmptyState'
import { LoadingState } from '../components/LoadingState'
import { ErrorAlert } from '../components/ErrorAlert'

export function CustomersPage() {
  const { businessSlug } = useParams()
  const { data: memberships, isLoading: isLoadingMemberships, isError: isMembershipsError } = useMemberships(businessSlug)
  const { data: pets, isLoading: isLoadingPets, isError: isPetsError } = usePets(businessSlug)

  if (isLoadingMemberships || isLoadingPets) return <LoadingState label="Loading customers…" />
  if (isMembershipsError || isPetsError) {
    return <ErrorAlert message="Something went wrong loading customers. Please try again." />
  }

  const customers = memberships.filter((membership) => membership.role === 'customer')
  const petCountByOwnerId = pets.reduce((counts, pet) => {
    counts[pet.owner.id] = (counts[pet.owner.id] ?? 0) + 1
    return counts
  }, {})

  return (
    <>
      <PageHeader title="Customers" description="Everyone with a customer account at this business." />
      <SectionCard>
        {customers.length === 0 ? (
          <EmptyState title="No customers yet" description="Customers appear here once they register." />
        ) : (
          <ResponsiveTable>
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Pets</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((membership) => (
                <tr key={membership.id}>
                  <td>{membership.user.email}</td>
                  <td>{petCountByOwnerId[membership.user.id] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        )}
      </SectionCard>
    </>
  )
}
