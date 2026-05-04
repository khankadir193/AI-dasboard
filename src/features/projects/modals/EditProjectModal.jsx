import Modal from '../../../components/common/Modal'
import ErrorAlert from '../../../components/common/ErrorAlert'
import { ProjectForm } from '../components/ProjectForm'

/**
 * EditProjectModal - Modal for editing an existing project
 * Presentational component - uses common Modal component
 */
export default function EditProjectModal({
  isOpen,
  projectName,
  formError,
  onNameChange,
  onSubmit,
  onCancel,
  isUpdating,
  inputRef,
  modalRef
}) {
  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      title="Edit Project"
      onClose={onCancel}
      modalRef={modalRef}
    >
      {formError && <ErrorAlert message={formError} onClose={() => onNameChange('')} />}
      
      <ProjectForm
        isEdit={true}
        projectName={projectName}
        formError={formError}
        onNameChange={onNameChange}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isLoading={isUpdating}
        inputRef={inputRef}
      />
    </Modal>
  )
}
