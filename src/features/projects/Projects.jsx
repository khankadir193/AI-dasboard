import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Plus, Trash2, Calendar, Activity, X, Edit } from 'lucide-react'
import { createProject, getProjects, deleteProject } from '../../lib/projectsApi'
import { supabase } from '../../lib/supabaseClient'

export default function Projects() {
  const dispatch = useDispatch()
  const { profile } = useSelector((state) => state.auth)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingProjectId, setDeletingProjectId] = useState(null)
  const [editingProjectId, setEditingProjectId] = useState(null)
  const [editProjectName, setEditProjectName] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [formError, setFormError] = useState('')
  const modalRef = useRef(null)
  const inputRef = useRef(null)

  const companyId = profile?.company_id || profile?.tenant_id

  // Edge case: Handle missing company_id
  useEffect(() => {
    if (!companyId) {
      setLoading(false)
      setError('No company associated with your account. Please contact support.')
      return
    }

    fetchProjects()
  }, [companyId])

  // Handle modal focus management
  useEffect(() => {
    if (showAddModal && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showAddModal])

  // Handle escape key for modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showAddModal) {
        closeModal()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showAddModal])

  const closeModal = () => {
    setShowAddModal(false)
    setNewProjectName('')
    setFormError('')
  }

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

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getProjects(companyId)
      setProjects(data || [])
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProject = async (e) => {
    e.preventDefault()
    
    // Validate input
    const validationError = validateProjectName(newProjectName)
    if (validationError) {
      setFormError(validationError)
      return
    }

    // Clear previous errors
    setError(null)
    setFormError('')

    try {
      setSubmitting(true)
      const trimmedName = newProjectName.trim()
      const newProject = await createProject(trimmedName, companyId)
      
      // Add project to the beginning of the list (newest first)
      setProjects([newProject, ...projects])
      
      // Reset form
      closeModal()
      
      // Clear any existing error
      setError(null)
    } catch (error) {
      console.error('Failed to create project:', error)
      setFormError(error.message || 'Failed to create project. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProject = async (projectId) => {
    const project = projects.find(p => p.id === projectId)
    const projectName = project?.name || 'this project'
    
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingProjectId(projectId)
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId)
      
      if (error) throw error
      
      // Remove project from list with optimistic update
      setProjects(projects.filter(p => p.id !== projectId))
      
      // Clear any existing error
      setError(null)
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project. Please try again.')
      setError(error.message || 'Failed to delete project. Please try again.')
    } finally {
      setDeletingProjectId(null)
    }
  }

  const handleEditProject = (project) => {
    if (profile?.role !== "admin") {
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

    try {
      setSubmitting(true)
      const { error } = await supabase
        .from("projects")
        .update({ name: editProjectName.trim() })
        .eq("id", editingProjectId)
      
      if (error) throw error
      
      // Update project in list
      setProjects(projects.map(p => 
        p.id === editingProjectId 
          ? { ...p, name: editProjectName.trim() }
          : p
      ))
      
      // Close modal and reset
      setShowEditModal(false)
      setEditProjectName('')
      setEditingProjectId(null)
      setFormError('')
    } catch (error) {
      console.error('Failed to update project:', error)
      alert('Failed to update project. Please try again.')
      setFormError(error.message || 'Failed to update project. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditProjectName('')
    setEditingProjectId(null)
    setFormError('')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
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
            onClick={fetchProjects}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            aria-label="Retry loading projects"
          >
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
                      <p>No projects found</p>
                      <p className="text-sm mt-2">Create your first project to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {project.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        project.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                      }`}>
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
                          disabled={profile?.role !== "admin"}
                          className={`text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                          aria-label={`Edit project ${project.name}`}
                          title={profile?.role === "admin" ? `Edit ${project.name}` : "Only administrators can edit projects"}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          disabled={profile?.role !== "admin" || deletingProjectId === project.id}
                          className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                          aria-label={`Delete project ${project.name}`}
                          title={profile?.role === "admin" ? `Delete ${project.name}` : "Only administrators can delete projects"}
                        >
                          {deletingProjectId === project.id ? (
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
            if (e.target === e.currentTarget) {
              closeModal()
            }
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
              <h2 
                id="modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                Add New Project
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
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
                    setFormError('') // Clear form error when typing
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    formError 
                      ? 'border-red-300 dark:border-red-700' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter project name"
                  aria-describedby={formError ? "project-name-error" : undefined}
                  maxLength={100}
                  required
                />
                {formError && (
                  <p 
                    id="project-name-error"
                    className="mt-2 text-sm text-red-600 dark:text-red-400"
                  >
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
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newProjectName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
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
            if (e.target === e.currentTarget) {
              closeEditModal()
            }
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
              <h2 
                id="edit-modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
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
                  onChange={(e) => setEditProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter project name"
                  disabled={submitting}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  2-100 characters, letters, numbers, spaces, hyphens, and underscores only
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !editProjectName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
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
