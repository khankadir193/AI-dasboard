import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Plus,
  Trash2,
  Calendar,
  Activity,
  X,
  Edit,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
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

export default function Projects() {
  const dispatch = useDispatch()
  const { profile, isLoading: authLoading } = useAuth()

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

  const isAdmin = profile?.role === 'admin'
  const companyId = profile?.company_id

  // ============================
  // Fetch projects on mount / when auth ready
  // ============================
  useEffect(() => {
    if (!authLoading) {
      if (companyId) {
        dispatch(fetchProjects(filters))
      } else {
        // Clear stale projects when companyId is missing to prevent data flicker
        dispatch(clearProjects())
      }
    }
  }, [dispatch, authLoading, companyId])

  // ============================
  // Refetch when filters change
  // ============================
  useEffect(() => {
    if (!authLoading && companyId) {
      const timer = setTimeout(() => {
        dispatch(fetchProjects(filters))
      }, 300) // Debounce search
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
    if (!isAdmin) {
      alert('Only administrators can delete projects.')
      return
    }

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
    if (!isAdmin) {
      alert('Only administrators can edit projects.')
      return
    }
    setEditingProjectId(project.id)
    setEditProjectName(project.name)
    setShowEditModal(true)
  }

  const handleUpdateProject = async (e) => {
    e.preventDefault()

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  // ============================
  // Render: Auth loading
  // ============================
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Authenticating...</p>
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
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by project name..."
            value={filters.search}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Status Filter */}
        <div className="relative sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={filters.status}
            onChange={(e) => dispatch(setStatusFilter(e.target.value))}
            className="w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          title="Refresh projects"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Inline error */}
      {error && projects.length > 0 && (
        <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg flex items-center justify-between">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          <button
            onClick={() => dispatch(clearProjectsError())}
            className="text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Projects Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center">
                      <Activity className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="font-medium">No projects found</p>
                      <p className="text-sm mt-2">
                        {filters.search || filters.status
                          ? 'Try adjusting your filters'
                          : 'Create your first project to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {project.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          project.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(project.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditProject(project)}
                          disabled={!isAdmin || updating}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label={`Edit project ${project.name}`}
                          title={isAdmin ? `Edit ${project.name}` : 'Only administrators can edit projects'}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          disabled={!isAdmin || deletingId === project.id}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label={`Delete project ${project.name}`}
                          title={isAdmin ? `Delete ${project.name}` : 'Only administrators can delete projects'}
                        >
                          {deletingId === project.id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddModal()
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Add New Project
              </h2>
              <button
                onClick={closeAddModal}
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

            <form onSubmit={handleAddProject}>
              <div className="mb-4">
                <label
                  htmlFor="project-name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Project Name
                </label>
                <input
                  id="project-name"
                  ref={inputRef}
                  type="text"
                  value={newProjectName}
                  onChange={(e) => {
                    setNewProjectName(e.target.value)
                    setFormError('')
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    formError
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter project name"
                  aria-describedby={formError ? 'project-name-error' : undefined}
                  maxLength={100}
                  required
                />
                {formError && (
                  <p id="project-name-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
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
                  onClick={closeAddModal}
                  disabled={creating}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newProjectName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Creating...
                    </span>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditModal()
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="edit-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Project
              </h2>
              <button
                onClick={closeEditModal}
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

            <form onSubmit={handleUpdateProject}>
              <div className="mb-4">
                <label
                  htmlFor="edit-project-name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Project Name
                </label>
                <input
                  id="edit-project-name"
                  ref={inputRef}
                  type="text"
                  value={editProjectName}
                  onChange={(e) => {
                    setEditProjectName(e.target.value)
                    setFormError('')
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    formError
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter project name"
                  disabled={updating}
                  maxLength={100}
                />
                {formError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  2-100 characters, letters, numbers, spaces, hyphens, and underscores only
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={updating}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating || !editProjectName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updating ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Updating...
                    </span>
                  ) : (
                    'Update Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

