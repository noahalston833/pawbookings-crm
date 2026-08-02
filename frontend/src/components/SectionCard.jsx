import PropTypes from 'prop-types'

// A plain content surface (white card, subtle border/shadow) used to
// group related information -- not a full design system, just one
// consistent wrapper instead of ad-hoc borders on every page.
export function SectionCard({ title = null, action = null, children, className = '' }) {
  return (
    <section className={`section-card p-3 p-md-4 mb-3 ${className}`.trim()}>
      {(title || action) && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          {title && <h2 className="h5 mb-0">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

SectionCard.propTypes = {
  title: PropTypes.string,
  action: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}
