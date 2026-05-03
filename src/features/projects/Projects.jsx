import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Plus, X, RefreshCw } from 'lucide-react'
import PermissionButton from '../../components/auth/PermissionButton.jsx'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../utils/permissions'
import {
  fetchProjects,
  createProject,
  deleteProject,
  updateProject,
  setStatusFilter,
  setSearchQuery,
  clearProjectsError,
  clearProjects,
  selectProjects,
  selectProjectsLoading,
  selectProjectsError,
  selectProjectsFilters,
  selectIsCreating,
  selectDeletingId,
  selectIsUpdating
} from '../../store/slices/projectsSlice'

// Components
import ProjectsFilters from './components/ProjectsFilters'
import ProjectsTable from './components/ProjectsTable'
import AddProjectModal from './modals/AddProjectModal'
import EditProjectModal from './modals/EditProjectModal'

// Common components
import ErrorAlert from '../../components/common/ErrorAlert'

export default function Projects() {
  const dispatch = useDispatch()
  const { user, loading: authLoading } = useSelector((state) => state.auth)
  const { profile, isLoading: profileLoading } = useSelector((state) => state.profile)

  // Redux state
  const projects = useSelector(selectProjects)
  const loading = useSelector(selectProjectsLoading)
  const error = useSelector(selectProjectsError)
  const filters = useSelector(selectProjectsFilters)
  const creating = useSelector(selectIsCreating)
  const deletingId = useSelector(selectDeletingId)
  const updating = useSelector(selectIsUpdating)

  // Local UI state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [formError, setFormError] = useState('')

  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState(null)
  const [editProjectName, setEditProjectName] = useState('')

  const inputRef = useRef(null)
  const modalRef = useRef(null)

  const companyId = profile?.company_id

  // Permission checks
  const { isAllowed: canCreate } = usePermission({ requiredPermission: PERMISSIONS.PROJECTS_CREATE })
  const { isAllowed: canUpdate, tooltip: updateTooltip } = usePermission({ requiredPermission: PERMISSIONS.PROJECTS_UPDATE })
  const { isAllowed: canDelete, tooltip: deleteTooltip } = usePermission({ requiredPermission: PERMISSIONS.PROJECTS_DELETE })

  // ============================
  // Fetch projects on mount / when auth and profile ready
  // ============================
  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (companyId) {
        dispatch(fetchProjects(filters))
      } else {
        dispatch(clearProjects())
      }
    }
  }, [dispatch, authLoading, companyId])

  // ============================
  // Refetch when filters change (debounced 300ms)
  // ============================
  useEffect(() => {
    if (!authLoading && !profileLoading && companyId) {
      const timer = setTimeout(() => {
        dispatch(fetchProjects(filters))
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [dispatch, authLoading, companyId, filters.status, filters.search])

  // ============================
  // Modal focus management
  // ============================
  useEffect(() => {
    if (showAddModal && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showAddModal])

  useEffect(() => {
    if (showEditModal && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showEditModal])

  // ============================
  // Escape key handler
  // ============================
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showAddModal) closeAddModal()
        if (showEditModal) closeEditModal()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showAddModal, showEditModal])

  // ============================
  // Validation
  // ============================
  const validateProjectName = (name) => {
    if (!name || name.trim().length === 0) {
      return 'Project name is required'
    }
    if (name.trim().length < 2) {
      return 'Project name must be at least 2 characters'
    }
    if (name.trim().length > 100) {
      return 'Project name must be less than 100 characters'
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name.trim())) {
      return 'Project name can only contain letters, numbers, spaces, hyphens, and underscores'
    }
    return ''
  }

  // ============================
  // Modal helpers
  // ============================
  const closeAddModal = useCallback(() => {
    setShowAddModal(false)
    setNewProjectName('')
    setFormError('')
    dispatch(clearProjectsError())
  }, [dispatch])

  const closeEditModal = useCallback(() => {
    setShowEditModal(false)
    setEditProjectName('')
    setEditingProjectId(null)
    setFormError('')
    dispatch(clearProjectsError())
  }, [dispatch])

  // ============================
  // Handlers
  // ============================
  const handleAddProject = async (e) => {
    e.preventDefault()
    if (!canCreate) return

    const validationError = validateProjectName(newProjectName)
    if (validationError) {
      setFormError(validationError)
      return
    }

    setFormError('')
    const resultAction = await dispatch(createProject(newProjectName.trim()))

    if (createProject.fulfilled.match(resultAction)) {
      closeAddModal()
    } else {
      setFormError(resultAction.payload || 'Failed to create project')
    }
  }

  const handleDeleteProject = async (projectId, projectName) => {
    if (!canDelete) return

    const confirmed = confirm(
      `Are you sure you want to delete "${projectName || 'this project'}"? This action cannot be undone.`
    )
    if (!confirmed) return

    const resultAction = await dispatch(deleteProject(projectId))

    if (!deleteProject.fulfilled.match(resultAction)) {
      alert(resultAction.payload || 'Failed to delete project. Please try again.')
    }
  }

  const handleEditProject = (project) => {
    if (!canUpdate) return
    setEditingProjectId(project.id)
    setEditProjectName(project.name)
    setShowEditModal(true)
  }

  const handleUpdateProject = async (e) => {
    e.preventDefault()
    if (!canUpdate) return

    if (!editingProjectId || !editProjectName.trim()) {
      setFormError('Project name is required')
      return
    }

    const validationError = validateProjectName(editProjectName)
    if (validationError) {
      setFormError(validationError)
      return
    }

    setFormError('')
    const resultAction = await dispatch(
      updateProject({
        projectId: editingProjectId,
        updates: { name: editProjectName.trim() }
      })
    )

    if (updateProject.fulfilled.match(resultAction)) {
      closeEditModal()
    } else {
      setFormError(resultAction.payload || 'Failed to update project')
    }
  }

  const handleRefresh = () => {
    dispatch(fetchProjects(filters))
  }

  // ============================
  // Render: Auth/Profile loading
  // ============================
  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // ============================
  // Render: Missing company
  // ============================
  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <div className="mx-auto h-12 w-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
            <X className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Company Associated
          </h3>
          <p className="text-red-600 dark:text-red-400">
            No company associated with your account. Please contact support.
          </p>
        </div>
      </div>
    )
  }

  // ============================
  // Render: Projects loading
  // ============================
  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading projects...</p>
        </div>
      </div>
    )
  }

  // ============================
  // Render: Error state
  // ============================
  if (error && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <div className="mx-auto h-12 w-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
            <X className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your company projects</p>
        </div>
        <PermissionButton
          onClick={() => setShowAddModal(true)}
          requiredPermission={PERMISSIONS.PROJECTS_CREATE}
          variant="primary"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Project
        </PermissionButton>
      </div>

      {/* Filters */}
      <ProjectsFilters
        search={filters.search}
        status={filters.status}
        onSearchChange={(value) => dispatch(setSearchQuery(value))}
        onStatusChange={(value) => dispatch(setStatusFilter(value))}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* Inline error */}
      {error && projects.length > 0 && (
        <ErrorAlert message={error} onClose={() => dispatch(clearProjectsError())} />
      )}

      {/* Projects Table */}
      <ProjectsTable
        projects={projects}
        deletingId={deletingId}
        onEdit={handleEditProject}
        onDelete={handleDeleteProject}
        canUpdate={canUpdate}
        canDelete={canDelete}
        updateTooltip={updateTooltip}
        deleteTooltip={deleteTooltip}
      />

      {/* Modals */}
      <AddProjectModal
        isOpen={showAddModal}
        projectName={newProjectName}
        formError={formError}
        onNameChange={setNewProjectName}
        onSubmit={handleAddProject}
        onCancel={closeAddModal}
        isCreating={creating}
        inputRef={inputRef}
        modalRef={modalRef}
      />

      <EditProjectModal
        isOpen={showEditModal}
        projectName={editProjectName}
        formError={formError}
        onNameChange={setEditProjectName}
        onSubmit={handleUpdateProject}
        onCancel={closeEditModal}
        isUpdating={updating}
        inputRef={inputRef}
        modalRef={modalRef}
      />
    </div>
  )
}
