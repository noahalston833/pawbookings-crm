import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import ToastContainer from 'react-bootstrap/ToastContainer'
import Toast from 'react-bootstrap/Toast'
import PropTypes from 'prop-types'

const ToastContext = createContext(undefined)

// Brief, auto-dismissing confirmations (see docs/frontend-style.md) --
// for anything that needs to stay visible until addressed, use
// ErrorAlert instead.
export function ToastProvider({ children }) {
  const [ toasts, setToasts ] = useState([])

  const showToast = useCallback((message, variant = 'success') => {
    setToasts((current) => [ ...current, { id: crypto.randomUUID(), message, variant } ])
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const value = useMemo(() => ({ showToast }), [ showToast ])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 1080 }}>
        {toasts.map((toast) => (
          <Toast key={toast.id} bg={toast.variant} onClose={() => dismissToast(toast.id)} delay={4000} autohide>
            <Toast.Body className={toast.variant === 'light' ? undefined : 'text-white'}>
              {toast.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  )
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
