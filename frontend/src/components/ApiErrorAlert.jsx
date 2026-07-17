import PropTypes from 'prop-types'

// Renders the backend's { message, details } error shape consistently --
// `details` is Rails' errors.to_hash (field name -> array of messages).
// Every form was previously showing only the generic top-level message,
// hiding exactly which field/why a request was rejected.
export function ApiErrorAlert({ error, children = null }) {
  const detailEntries = Object.entries(error.details ?? {})

  return (
    <div role="alert">
      <p>
        {error.message}
        {children}
      </p>
      {detailEntries.length > 0 && (
        <ul>
          {detailEntries.map(([ field, messages ]) => (
            <li key={field}>{field}: {messages.join(', ')}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

ApiErrorAlert.propTypes = {
  error: PropTypes.shape({
    message: PropTypes.string.isRequired,
    details: PropTypes.object,
  }).isRequired,
  children: PropTypes.node,
}
