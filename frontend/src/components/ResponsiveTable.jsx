import Table from 'react-bootstrap/Table'
import PropTypes from 'prop-types'

// Consistent table chrome (responsive scroll wrapper, hover state,
// comfortable spacing) -- individual pages still own their own
// <thead>/<tbody> markup, this just standardizes the shell around it.
export function ResponsiveTable({ children }) {
  return (
    <div className="table-responsive">
      <Table hover responsive className="table-comfortable align-middle mb-0">
        {children}
      </Table>
    </div>
  )
}

ResponsiveTable.propTypes = {
  children: PropTypes.node.isRequired,
}
