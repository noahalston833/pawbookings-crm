import PropTypes from 'prop-types'

// Status is never conveyed by color alone: a small dot plus the text
// label together, using Bootstrap 5.3's "subtle" palette (light
// background, dark emphasis text) for sufficient contrast without a
// loud, saturated badge.
export function StatusBadge({ label, variant = 'secondary' }) {
  return (
    <span
      className={
        `badge fw-normal d-inline-flex align-items-center gap-1 border ` +
        `bg-${variant}-subtle text-${variant}-emphasis border-${variant}-subtle`
      }
    >
      <span className={`status-badge__dot text-${variant}`} aria-hidden="true" />
      {label}
    </span>
  )
}

StatusBadge.propTypes = {
  label: PropTypes.string.isRequired,
  variant: PropTypes.oneOf([ 'primary', 'success', 'warning', 'danger', 'secondary', 'info' ]),
}
