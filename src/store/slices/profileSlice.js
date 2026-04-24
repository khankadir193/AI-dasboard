import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabaseClient'

// Async thunk for fetching user profile with tenant data
export const fetchUserProfile = createAsyncThunk(
  'profile/fetchUserProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          company:company_id (*)
        `)
        .eq('id', userId)
        .single()

      if (error) throw error
      
      // Normalize the data structure
      return {
        ...data,
        tenant_id: data.company_id,
        tenant: data.company
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk for updating user profile
export const updateUserProfile = createAsyncThunk(
  'profile/updateUserProfile',
  async ({ userId, updates }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    profile: null,
    isLoading: false,
    error: null,
    permissions: []
  },
  reducers: {
    clearProfileError: (state) => {
      state.error = null
    },
    setProfile: (state, action) => {
      state.profile = action.payload
      // Extract permissions based on role
      state.permissions = getRolePermissions(action.payload?.role)
    },
    clearProfile: (state) => {
      state.profile = null
      state.permissions = []
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile = action.payload
        state.permissions = getRolePermissions(action.payload?.role)
        state.error = null
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
      // Update User Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile = action.payload
        state.permissions = getRolePermissions(action.payload?.role)
        state.error = null
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  }
})

// Helper function to get permissions based on role
function getRolePermissions(role) {
  const permissions = {
    admin: [
      'view_dashboard',
      'view_analytics',
      'view_ai_insights',
      'view_data_table',
      'view_settings',
      'manage_users',
      'manage_tenant',
      'export_data',
      'delete_data'
    ],
    user: [
      'view_dashboard',
      'view_analytics',
      'view_ai_insights',
      'view_data_table',
      'view_settings',
      'export_data'
    ],
    viewer: [
      'view_dashboard',
      'view_analytics',
      'view_ai_insights',
      'view_data_table'
    ]
  }
  
  return permissions[role] || []
}

export const { clearProfileError, setProfile, clearProfile } = profileSlice.actions
export default profileSlice.reducer
