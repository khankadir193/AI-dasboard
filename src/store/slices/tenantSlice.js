import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabaseClient'

// Async thunk for fetching tenant details
export const fetchTenantDetails = createAsyncThunk(
  'tenant/fetchTenantDetails',
  async (tenantId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', tenantId)
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('Company not found')
      
      return data
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
      const { data, error } = await supabase
        .from('companies')
        .update({ settings })
        .eq('id', tenantId)
        .select()
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('Company update failed')
      
      return data
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
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_auth:auth.users!inner(email, created_at)
        `)
        .eq('company_id', tenantId)

      if (error) throw error
      
      return data
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
