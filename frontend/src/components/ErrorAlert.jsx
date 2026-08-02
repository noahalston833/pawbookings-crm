import Alert from 'react-bootstrap/Alert'
import PropTypes from 'prop-types'

// Renders either a structured API error ({ message, details }, details
// being Rails' field -> [messages] hash) or a plain message string --
// every screen's error state (form validation, list-load failure, action
// failure) goes through this one component instead of duplicated JSX.
export function ErrorAlert({ error = null, message = null, title = null, children = null }) {
  const text = error?.message ?? message
  const detailEntries = Object.entries(error?.details ?? {})

  return (
    <Alert variant="danger" role="alert" className="mb-3">
      {title && <Alert.Heading as="h2" className="h6">{title}</Alert.Heading>}
      <p className={detailEntries.length > 0 || children ? 'mb-1' : 'mb-0'}>
        {text}
        {children}
      </p>
      {detailEntries.length > 0 && (
        <ul className="mb-0 ps-3">
          {detailEntries.map(([ field, messages ]) => (
            <li key={field}>{field}: {messages.join(', ')}</li>
          ))}
        </ul>
      )}
    </Alert>
  )
}

ErrorAlert.propTypes = {
  error: PropTypes.shape({
    message: PropTypes.string.isRequired,
    details: PropTypes.object,
  }),
  message: PropTypes.string,
  title: PropTypes.string,
  children: PropTypes.node,
}
