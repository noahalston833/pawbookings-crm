import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import PropTypes from 'prop-types'

// Replaces window.confirm() for anything destructive or hard to undo
// (archiving a pet, removing a member, cancelling/accepting a booking).
export function ConfirmationModal({
  show, title, body, confirmLabel = 'Confirm', confirmVariant = 'primary', onConfirm, onCancel,
  isConfirming = false, confirmDisabled = false,
}) {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="h5">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel} disabled={isConfirming}>
          Cancel
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} disabled={isConfirming || confirmDisabled}>
          {isConfirming ? 'Please wait\u2026' : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

ConfirmationModal.propTypes = {
  show: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  body: PropTypes.node.isRequired,
  confirmLabel: PropTypes.string,
  confirmVariant: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isConfirming: PropTypes.bool,
  confirmDisabled: PropTypes.bool,
}
