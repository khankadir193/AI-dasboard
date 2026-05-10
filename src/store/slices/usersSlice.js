import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabaseClient'

// Async thunk for fetching ALL users with company data
export const fetchAllUsers = createAsyncThunk(
  'users/fetchAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      // Determine tenant scope from currently logged-in user profile (company_id)
      const {
        data: { user: authUser },
        error: authUserError
      } = await supabase.auth.getUser()

      if (authUserError) {
        console.error('Supabase auth.getUser error:', authUserError)
      }

      const authUid = authUser?.id
      if (!authUid) {
        return []
      }

      const { data: myProfile, error: myProfileError } = await supabase
        .from('profiles')
        .select('id, company_id')
        .eq('id', authUid)
        .maybeSingle()

      if (myProfileError) throw myProfileError
      if (!myProfile?.company_id) return []

      const tenantCompanyId = myProfile.company_id

      // Fetch profiles for ONLY the logged-in user's company, and join the company name
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          companies:company_id (
            id,
            name
          )
        `)
        .eq('company_id', tenantCompanyId)

      if (error) {
        console.error('Supabase profiles fetch error:', error)
        throw error
      }

      const users = (profiles || []).map((profile) => {
        const email = profile?.email || ''

        // Prefer first_name/last_name when present; fallback to email prefix
        const first = (profile?.first_name || '').trim()
        const last = (profile?.last_name || '').trim()
        const fullName = [first, last].filter(Boolean).join(' ').trim();

        const emailPrefix = email.split('@')[0] || 'user'
        const fallbackName = emailPrefix
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())

          console.log('fallbackName..',fallbackName);
        const displayName = fullName || fallbackName || 'Unknown'

        // Handle company data shape - Supabase join may return object or array depending on relation
        const companyData = profile?.companies
        const companyObj = Array.isArray(companyData) ? companyData[0] : companyData
        const companyName = companyObj?.name ?? null

        return {
          id: profile.id,
          email,
          role: profile.role || 'viewer',
          is_active: profile.is_active !== false,
          created_at: profile.created_at,
          company_id: profile.company_id,
          permissions: profile.permissions,
          avatar_url: profile.avatar_url,
          updated_at: profile.updated_at,
          displayName,
          company: { name: companyName }
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
