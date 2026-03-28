import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A logged-out/forbidden response isn't a transient failure --
      // retrying it just spams the API with the same 401/403.
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})
