import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  fetchProjects as fetchProjectsApi,
  createProject as createProjectApi,
  deleteProject as deleteProjectApi,
  updateProject as updateProjectApi
} from '../../services/projectsService'

// ============================
// Async Thunks
// ============================

/**
 * Fetch projects for the current user's company
 * Automatically derives company_id from auth profile
 */
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const data = await fetchProjectsApi(filters)
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
  async (name, { rejectWithValue }) => {
    try {
      const data = await createProjectApi(name)
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
  async (projectId, { rejectWithValue }) => {
    try {
      await deleteProjectApi(projectId)
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
  async ({ projectId, updates }, { rejectWithValue }) => {
    try {
      const data = await updateProjectApi(projectId, updates)
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
    creating: false,
    deletingId: null,
    updating: false,
    error: null,
    filters: {
      status: '', // 'active' | 'inactive' | ''
      search: ''
    }
  },
  reducers: {
    setStatusFilter: (state, action) => {
      state.filters.status = action.payload
    },
    setSearchQuery: (state, action) => {
      state.filters.search = action.payload
    },
    clearProjectsError: (state) => {
      state.error = null
    },
    clearProjects: (state) => {
      state.items = []
      state.error = null
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
        state.items = action.payload
        state.error = null
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false
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
export const selectProjectsError = (state) => state.projects.error
export const selectProjectsFilters = (state) => state.projects.filters
export const selectIsCreating = (state) => state.projects.creating
export const selectDeletingId = (state) => state.projects.deletingId
export const selectIsUpdating = (state) => state.projects.updating

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
  clearProjects
} = projectsSlice.actions

export default projectsSlice.reducer

