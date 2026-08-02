import PropTypes from 'prop-types'

export function EmptyState({ title, description = null, action = null }) {
  return (
    <div className="empty-state">
      <p className="fw-semibold mb-1">{title}</p>
      {description && <p className="mb-3">{description}</p>}
      {action}
    </div>
  )
}

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
}
