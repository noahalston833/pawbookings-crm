import axios from 'axios'

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1',
  // Cookie session, not a bearer token -- see docs/decisions/0002.
  withCredentials: true,
})

// The CSRF token is bound to the current session; login/logout rotate the
// session (reset_session), which invalidates whatever token we cached
// before. Callers must invalidateCsrfToken() right after those succeed.
let csrfTokenPromise = null

async function fetchCsrfToken() {
  const response = await client.get('/csrf_token')
  return response.data.csrf_token
}

export function invalidateCsrfToken() {
  csrfTokenPromise = null
}

const MUTATING_METHODS = new Set(['post', 'patch', 'put', 'delete'])

client.interceptors.request.use(async (config) => {
  const method = (config.method ?? 'get').toLowerCase()
  if (MUTATING_METHODS.has(method)) {
    csrfTokenPromise ??= fetchCsrfToken()
    config.headers['X-CSRF-Token'] = await csrfTokenPromise
  }
  return config
})

// Normalizes the backend's { error: { code, message, details, request_id } }
// shape into something components can render without touching axios
// internals, and gives network failures a shape components can rely on too.
export function getApiError(error) {
  const payload = error.response?.data?.error
  if (payload) return payload

  return {
    code: 'network_error',
    message: 'Could not reach the server. Please check your connection and try again.',
    details: {},
  }
}
