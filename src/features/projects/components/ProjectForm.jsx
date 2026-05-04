import { X } from 'lucide-react'

/**
 * ProjectForm - Shared form for adding/editing projects
 * Presentational component - receives all data/handlers as props
 */
export function ProjectForm({
  isEdit,
  projectName,
  formError,
  onNameChange,
  onSubmit,
  onCancel,
  isLoading,
  inputRef
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="mb-4">
        <label
          htmlFor={isEdit ? 'edit-project-name' : 'project-name'}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Project Name
        </label>
        <input
          id={isEdit ? 'edit-project-name' : 'project-name'}
          ref={inputRef}
          type="text"
          value={projectName}
          onChange={(e) => {
            onNameChange(e.target.value)
            if (formError) formError('')
          }}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
            formError
              ? 'border-red-300 dark:border-red-700'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Enter project name"
          disabled={isLoading}
          maxLength={100}
          required
        />
        {formError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {formError}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          2-100 characters, letters, numbers, spaces, hyphens, and underscores only
        </p>
      </div>
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !projectName.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Project' : 'Create Project')}
        </button>
      </div>
    </form>
  )
}

/**
 * Shared Modal component for Add/Edit
 */
export function ProjectModal({
  isOpen,
  isEdit,
  projectName,
  formError,
  onNameChange,
  onSubmit,
  onCancel,
  isLoading,
  inputRef,
  modalRef
}) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={isEdit ? 'edit-modal-title' : 'modal-title'}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id={isEdit ? 'edit-modal-title' : 'modal-title'} className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Project' : 'Add New Project'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {formError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{formError}</p>
          </div>
        )}

        <ProjectForm
          isEdit={isEdit}
          projectName={projectName}
          formError={formError}
          onNameChange={onNameChange}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isLoading={isLoading}
          inputRef={inputRef}
        />
      </div>
    </div>
  )
}
