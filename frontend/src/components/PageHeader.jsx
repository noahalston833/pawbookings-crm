import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

// Consistent title + optional one-line description + primary action,
// used at the top of every main page (see docs/frontend-style.md).
export function PageHeader({ title, description = null, action = null, breadcrumbs = null }) {
  return (
    <header className="page-header">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="breadcrumb mb-2">
            {breadcrumbs.map((crumb, index) => (
              <li
                key={crumb.label}
                className={`breadcrumb-item${index === breadcrumbs.length - 1 ? ' active' : ''}`}
                aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
              >
                {crumb.to && index !== breadcrumbs.length - 1 ? (
                  <Link to={crumb.to}>{crumb.label}</Link>
                ) : (
                  crumb.label
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h1 className="h3 mb-1">{title}</h1>
          {description && <p className="page-header__description mb-0">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </header>
  )
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
  breadcrumbs: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    to: PropTypes.string,
  })),
}
