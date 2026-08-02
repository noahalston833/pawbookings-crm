import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

// A single number with a label, optionally linking to where that number
// comes from -- used in small rows on the customer/business dashboards.
// Deliberately just a number: no sparkline, no trend arrow, nothing
// invented to fill space.
export function StatCard({ label, value, to = null }) {
  const content = (
    <div className="stat-card p-3 h-100">
      <p className="text-muted mb-1">{label}</p>
      <p className="stat-card__value mb-0">{value}</p>
    </div>
  )

  if (!to) return content

  return (
    <Link to={to} className="text-decoration-none text-reset d-block h-100">
      {content}
    </Link>
  )
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]).isRequired,
  to: PropTypes.string,
}
