import Modal from '../../../components/common/Modal'
import ErrorAlert from '../../../components/common/ErrorAlert'
import { ProjectForm } from '../components/ProjectForm'

/**
 * AddProjectModal - Modal for adding a new project
 * Presentational component - uses common Modal component
 */
export default function AddProjectModal({
  isOpen,
  projectName,
  formError,
  onNameChange,
  onSubmit,
  onCancel,
  isCreating,
  inputRef,
  modalRef
}) {
  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      title="Add New Project"
      onClose={onCancel}
      modalRef={modalRef}
    >
      {formError && <ErrorAlert message={formError} onClose={() => onNameChange('')} />}
      
      <ProjectForm
        isEdit={false}
        projectName={projectName}
        formError={formError}
        onNameChange={onNameChange}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isLoading={isCreating}
        inputRef={inputRef}
      />
    </Modal>
  )
}
