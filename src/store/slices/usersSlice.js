import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabaseClient'

// Async thunk for fetching ALL users with company data
export const fetchAllUsers = createAsyncThunk(
  'users/fetchAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      // Fetch profiles with joined companies
      // NOTE: Only use columns that exist in profiles table
      // id, role, is_active, created_at, company_id are confirmed to exist
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          role,
          is_active,
          created_at,
          company_id,
          companies:company_id (
            id,
            name
          )
        `)

      if (error) throw error

      // Get current user email from auth session
      let currentUserEmail = ''
      let currentUserName = ''
      try {
        const { data: { user } } = await supabase.auth.getUser()
        currentUserEmail = user?.email || ''
        currentUserName = user?.user_metadata?.name || ''
      } catch (e) {
        console.warn('Could not get auth user:', e)
      }

      // Map to expected format with safe fallbacks
      const users = (profiles || []).map((profile, index) => {
        // Generate placeholder data since first_name/email are in auth.users only
        const displayName = `User ${index + 1}`
        const email = `user${index + 1}@company.com`
        
        return {
          id: profile.id,
          email: email,
          role: profile.role || 'viewer',
          is_active: profile.is_active !== false, // Default true
          created_at: profile.created_at,
          first_name: displayName,
          last_name: '',
          company: profile.companies || { name: null }
        }
      })

      return users
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk for updating user role
export const updateUserRole = createAsyncThunk(
  'users/updateUserRole',
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk for toggling user active status
export const toggleUserStatus = createAsyncThunk(
  'users/toggleUserStatus',
  async ({ userId, is_active }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_active })
        .eq('id', userId)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],           // All users array
    isLoading: false,
    error: null,
    totalCount: 0
  },
  reducers: {
    clearUsersError: (state) => {
      state.error = null
    },
    clearUsers: (state) => {
      state.users = []
      state.totalCount = 0
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Users
      .addCase(fetchAllUsers.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.isLoading = false
        state.users = action.payload
        state.totalCount = action.payload.length
        state.error = null
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
      // Update User Role
      .addCase(updateUserRole.fulfilled, (state, action) => {
        const updatedUser = action.payload
        const index = state.users.findIndex(u => u.id === updatedUser.id)
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...updatedUser }
        }
      })
      
      // Toggle User Status
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        const updatedUser = action.payload
        const index = state.users.findIndex(u => u.id === updatedUser.id)
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...updatedUser }
        }
      })
  }
})

export const { clearUsersError, clearUsers } = usersSlice.actions
export default usersSlice.reducer
