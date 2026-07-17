import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  fetchProjects as fetchProjectsApi,
  createProject as createProjectApi,
  deleteProject as deleteProjectApi,
  updateProject as updateProjectApi
} from '../../services/projectsService'
import { trackEvent } from '../../features/analytics/trackEvent'
import { logActivity, ACTIONS, RESOURCE_TYPES } from '../../services/activityLogService'
import { createNotification } from '../../services/notificationsService'

// ============================
// Async Thunks
// ============================

/**
 * Fetch projects for the current user's company
 * Automatically derives company_id from auth profile
 */
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (filters = {}, { rejectWithValue, getState }) => {
    try {
      const { page, limit } = getState().projects.pagination
      const data = await fetchProjectsApi({ ...filters, page, limit })
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

/**
 * Create a new project
 */
export const createProject = createAsyncThunk(
  'projects/createProject',
  async (name, { rejectWithValue, getState }) => {
    try {
      const data = await createProjectApi(name)

      // Track analytics after successful project creation
      const state = getState()
      const companyId = state.profile?.profile?.company_id
      const userId = state.profile?.profile?.id

      if (companyId) {
        trackEvent({
          companyId,
          type: 'projects_created',
          value: 1
        })

        logActivity({
          companyId,
          userId,
          action: ACTIONS.PROJECT_CREATE,
          resourceType: RESOURCE_TYPES.PROJECT,
          resourceId: data?.id,
          description: `Project "${data?.name || ''}" created`,
          metadata: { projectName: data?.name }
        })

        createNotification({
          companyId,
          userId,
          type: 'project_created',
          title: 'Project Created',
          message: `Project "${data?.name || ''}" has been created.`,
          priority: 'medium',
          resourceType: 'project',
          resourceId: data?.id,
          metadata: { projectName: data?.name }
        }).catch(err => console.error('[projectsSlice] createNotification failed:', err))
      }

      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

/**
 * Delete a project by ID
 */
export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (projectId, { rejectWithValue, getState }) => {
    try {
      const deletedProject = await deleteProjectApi(projectId)

      // Track analytics after successful project deletion
      const state = getState()
      const companyId = state.profile?.profile?.company_id
      const userId = state.profile?.profile?.id

      if (companyId) {
        trackEvent({
          companyId,
          type: 'projects_deleted',
          value: 1
        })

        logActivity({
          companyId,
          userId,
          action: ACTIONS.PROJECT_DELETE,
          resourceType: RESOURCE_TYPES.PROJECT,
          resourceId: projectId,
          description: `Project "${deletedProject?.name || ''}" deleted`,
          metadata: { projectName: deletedProject?.name }
        })

        createNotification({
          companyId,
          userId,
          type: 'project_deleted',
          title: 'Project Deleted',
          message: `Project "${deletedProject?.name || ''}" has been deleted.`,
          priority: 'high',
          resourceType: 'project',
          resourceId: projectId,
          metadata: { projectName: deletedProject?.name }
        }).catch(err => console.error('[projectsSlice] createNotification failed:', err))
      }

      return projectId
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

/**
 * Update a project by ID
 */
export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ projectId, updates }, { rejectWithValue, getState }) => {
    try {
      const data = await updateProjectApi(projectId, updates)

      // Track analytics after successful project update
      const state = getState()
      const companyId = state.profile?.profile?.company_id
      const userId = state.profile?.profile?.id

      if (companyId) {
        trackEvent({
          companyId,
          type: 'projects_updated',
          value: 1
        })

        logActivity({
          companyId,
          userId,
          action: ACTIONS.PROJECT_UPDATE,
          resourceType: RESOURCE_TYPES.PROJECT,
          resourceId: projectId,
          description: `Project "${data?.name || ''}" updated`,
          metadata: { updates }
        })

        createNotification({
          companyId,
          userId,
          type: 'project_updated',
          title: 'Project Updated',
          message: `Project "${data?.name || ''}" has been updated.`,
          priority: 'low',
          resourceType: 'project',
          resourceId: projectId,
          metadata: { updates }
        }).catch(err => console.error('[projectsSlice] createNotification failed:', err))
      }

      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// ============================
// Slice
// ============================

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    items: [],
    loading: false,
    changingPage: false,
    creating: false,
    deletingId: null,
    updating: false,
    error: null,
    filters: {
      status: '', // 'active' | 'inactive' | ''
      search: ''
    },
    pagination: {
      page: 1,
      limit: 5,
      totalCount: 0
    }
  },
  reducers: {
    setStatusFilter: (state, action) => {
      state.filters.status = action.payload
      state.pagination.page = 1
    },
    setSearchQuery: (state, action) => {
      state.filters.search = action.payload
      state.pagination.page = 1
    },
    clearProjectsError: (state) => {
      state.error = null
    },
    clearProjects: (state) => {
      state.items = []
      state.error = null
      state.pagination.page = 1
      state.pagination.totalCount = 0
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload
      state.changingPage = true
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload
      state.pagination.page = 1 // Reset to page 1 when limit changes
    }
  },
  extraReducers: (builder) => {
    builder
      // ----- Fetch Projects -----
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false
        state.changingPage = false
        state.items = action.payload.items || action.payload
        state.pagination.totalCount = action.payload.totalCount || action.payload.length || 0
        state.error = null
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false
        state.changingPage = false
        state.error = action.payload
      })

      // ----- Create Project -----
      .addCase(createProject.pending, (state) => {
        state.creating = true
        state.error = null
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.creating = false
        state.items.unshift(action.payload) // Add to top
        state.pagination.totalCount = (state.pagination.totalCount || 0) + 1
        state.pagination.page = 1 // Reset to first page after creation
        state.error = null
      })
      .addCase(createProject.rejected, (state, action) => {
        state.creating = false
        state.error = action.payload
      })

      // ----- Delete Project -----
      .addCase(deleteProject.pending, (state, action) => {
        state.deletingId = action.meta.arg
        state.error = null
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.deletingId = null
        state.items = state.items.filter(p => p.id !== action.payload)
        state.pagination.totalCount = Math.max(0, (state.pagination.totalCount || 0) - 1)
        
        // If last item on page is deleted and not on first page, go to previous page
        const totalPages = Math.ceil(state.pagination.totalCount / state.pagination.limit)
        if (state.pagination.page > totalPages && state.pagination.page > 1) {
          state.pagination.page = totalPages
        }
        
        state.error = null
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.deletingId = null
        state.error = action.payload
      })

      // ----- Update Project -----
      .addCase(updateProject.pending, (state) => {
        state.updating = true
        state.error = null
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.updating = false
        const index = state.items.findIndex(p => p.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
        state.error = null
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.updating = false
        state.error = action.payload
      })
  }
})

// ============================
// Selectors
// ============================

export const selectProjects = (state) => state.projects.items
export const selectProjectsLoading = (state) => state.projects.loading
export const selectChangingPage = (state) => state.projects.changingPage
export const selectProjectsError = (state) => state.projects.error
export const selectProjectsFilters = (state) => state.projects.filters
export const selectIsCreating = (state) => state.projects.creating
export const selectDeletingId = (state) => state.projects.deletingId
export const selectIsUpdating = (state) => state.projects.updating
export const selectPagination = (state) => state.projects.pagination

/**
 * Client-side filtered projects (fallback if not using server-side filtering)
 */
export const selectFilteredProjects = (state) => {
  const { items, filters } = state.projects
  let result = items

  if (filters.status) {
    result = result.filter(p => p.status === filters.status)
  }

  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim().toLowerCase()
    result = result.filter(p => p.name.toLowerCase().includes(term))
  }

  return result
}

export const {
  setStatusFilter,
  setSearchQuery,
  clearProjectsError,
  clearProjects,
  setPage,
  setLimit
} = projectsSlice.actions

export default projectsSlice.reducer

