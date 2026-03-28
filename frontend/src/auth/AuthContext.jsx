import { createContext, useContext, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { client, getApiError, invalidateCsrfToken } from '../api/client'

const AuthContext = createContext(undefined)

async function fetchCurrentUser() {
  try {
    const { data } = await client.get('/session')
    return data.user
  } catch (error) {
    // Not logged in is a normal, successful outcome for this query --
    // only genuine failures (network/500) should surface as query errors.
    if (error.response?.status === 401) return null
    throw error
  }
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
  })

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const { data } = await client.post('/session', { session: { email, password } })
      return data.user
    },
    onSuccess: (loggedInUser) => {
      invalidateCsrfToken()
      queryClient.setQueryData(['currentUser'], loggedInUser)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => client.delete('/session'),
    onSuccess: () => {
      invalidateCsrfToken()
      // Wipes every tenant-scoped cache entry, not just the user -- the
      // next login may be a different user in a different business.
      queryClient.clear()
      queryClient.setQueryData(['currentUser'], null)
    },
  })

  const value = useMemo(
    () => ({
      user: user ?? null,
      isLoading,
      login: loginMutation.mutateAsync,
      isLoggingIn: loginMutation.isPending,
      loginError: loginMutation.error ? getApiError(loginMutation.error) : null,
      logout: logoutMutation.mutateAsync,
    }),
    [ user, isLoading, loginMutation, logoutMutation ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
