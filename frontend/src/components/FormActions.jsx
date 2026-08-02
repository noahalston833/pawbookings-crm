import Button from 'react-bootstrap/Button'
import PropTypes from 'prop-types'

// Consistent Save/Cancel placement (Cancel first, secondary; primary
// action last) for every form in the app.
export function FormActions({
  onCancel, isSubmitting = false, submitLabel = 'Save', submittingLabel = 'Saving…', cancelLabel = 'Cancel',
}) {
  return (
    <div className="d-flex justify-content-end gap-2 mt-4">
      <Button type="button" variant="outline-secondary" onClick={onCancel} disabled={isSubmitting}>
        {cancelLabel}
      </Button>
      <Button type="submit" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </div>
  )
}

FormActions.propTypes = {
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  submitLabel: PropTypes.string,
  submittingLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
}
