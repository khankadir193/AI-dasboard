import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  fetchTenantDetails as fetchTenantDetailsService,
  updateTenantSettings as updateTenantSettingsService,
  fetchTenantUsers as fetchTenantUsersService
} from '../../services/tenantService'

// Async thunk for fetching tenant details
export const fetchTenantDetails = createAsyncThunk(
  'tenant/fetchTenantDetails',
  async (tenantId, { rejectWithValue }) => {
    try {
      return await fetchTenantDetailsService(tenantId)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk for updating tenant settings
export const updateTenantSettings = createAsyncThunk(
  'tenant/updateTenantSettings',
  async ({ tenantId, settings }, { rejectWithValue }) => {
    try {
      return await updateTenantSettingsService(tenantId, settings)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk for fetching tenant users
export const fetchTenantUsers = createAsyncThunk(
  'tenant/fetchTenantUsers',
  async (tenantId, { rejectWithValue }) => {
    try {
      return await fetchTenantUsersService(tenantId)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const tenantSlice = createSlice({
  name: 'tenant',
  initialState: {
    currentTenant: null,
    users: [],
    isLoading: false,
    error: null
  },
  reducers: {
    clearTenantError: (state) => {
      state.error = null
    },
    setCurrentTenant: (state, action) => {
      state.currentTenant = action.payload
    },
    clearTenant: (state) => {
      state.currentTenant = null
      state.users = []
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tenant Details
      .addCase(fetchTenantDetails.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchTenantDetails.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentTenant = action.payload
        state.error = null
      })
      .addCase(fetchTenantDetails.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
      // Update Tenant Settings
      .addCase(updateTenantSettings.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateTenantSettings.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentTenant = action.payload
        state.error = null
      })
      .addCase(updateTenantSettings.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
      // Fetch Tenant Users
      .addCase(fetchTenantUsers.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchTenantUsers.fulfilled, (state, action) => {
        state.isLoading = false
        state.users = action.payload
        state.error = null
      })
      .addCase(fetchTenantUsers.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  }
})

export const { clearTenantError, setCurrentTenant, clearTenant } = tenantSlice.actions
export default tenantSlice.reducer
