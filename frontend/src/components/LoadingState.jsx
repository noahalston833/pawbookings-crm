import Spinner from 'react-bootstrap/Spinner'
import PropTypes from 'prop-types'

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="d-flex align-items-center gap-2 text-muted py-4" role="status">
      <Spinner animation="border" size="sm" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

LoadingState.propTypes = {
  label: PropTypes.string,
}
