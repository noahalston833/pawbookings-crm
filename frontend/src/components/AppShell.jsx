import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Container from 'react-bootstrap/Container'
import NavDropdown from 'react-bootstrap/NavDropdown'
import PropTypes from 'prop-types'
import { Link, NavLink } from 'react-router-dom'

// The one authenticated-area shell: top navigation (brand, current
// business, role-aware links, user menu) plus a max-width main content
// area. Every authenticated page renders inside this via BusinessLayout/
// MyBusinessesPage rather than styling its own header.
export function AppShell({
  homeTo, businessName = null, navItems, userEmail, roleLabel = null, onLogout, children,
}) {
  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar expand="xl" className="app-shell__navbar" sticky="top">
        <Container fluid="lg">
          <Navbar.Brand as={Link} to={homeTo} className="app-shell__brand flex-shrink-0">
            PawBookings CRM
          </Navbar.Brand>
          {businessName && (
            <span
              className="text-muted small d-none d-md-inline me-3 text-truncate flex-shrink-0"
              style={{ maxWidth: '16rem' }}
            >
              {businessName}
            </span>
          )}
          <Navbar.Toggle aria-controls="app-shell-nav" />
          <Navbar.Collapse id="app-shell-nav">
            <Nav className="me-auto">
              {navItems.map((item) => (
                <Nav.Link key={item.to} as={NavLink} to={item.to} end={item.end}>
                  {item.label}
                </Nav.Link>
              ))}
            </Nav>
            <Nav>
              <NavDropdown
                id="app-shell-user-menu"
                align="end"
                title={(
                  <span>
                    {userEmail}
                    {roleLabel && <span className="text-muted"> ({roleLabel})</span>}
                  </span>
                )}
              >
                <NavDropdown.Item onClick={onLogout}>Log out</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <main className="app-shell__main flex-grow-1 w-100 px-3 px-md-4">
        {children}
      </main>
    </div>
  )
}

AppShell.propTypes = {
  homeTo: PropTypes.string.isRequired,
  businessName: PropTypes.string,
  navItems: PropTypes.arrayOf(PropTypes.shape({
    to: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    end: PropTypes.bool,
  })).isRequired,
  userEmail: PropTypes.string.isRequired,
  roleLabel: PropTypes.string,
  onLogout: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
}
