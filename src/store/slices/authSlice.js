import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabaseClient'

// Async thunks for authentication
export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      return data.user
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ email, password, companyName }, { rejectWithValue }) => {
    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      })
      
      if (authError) throw authError
      
      const user = authData.user
      if (!user) {
        throw new Error('Please check your email for confirmation link')
      }

      // Step 2: Create tenant (using companies table for backward compatibility)
      const { data: tenant, error: tenantError } = await supabase
        .from('companies')
        .insert({ name: companyName })
        .select()
        .maybeSingle()

      if (tenantError) throw tenantError
      if (!tenant) throw new Error('Failed to create company')

      // Step 3: Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          company_id: tenant.id, // Use company_id for existing schema
          role: 'admin'
        })

      if (profileError) throw profileError

      return { user, tenant }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error
      
      return session?.user || null
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    profile: null,
    isLoading: false,
    isAuthenticated: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setAuthUser: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
    },
    setUserProfile: (state, action) => {
      state.profile = action.payload
    },
    clearAuth: (state) => {
      state.user = null
      state.profile = null
      state.isAuthenticated = false
      state.isLoading = false
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Sign In
      .addCase(signIn.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.isAuthenticated = false
      })
      
      // Sign Up
      .addCase(signUp.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.isAuthenticated = false
      })
      
      // Sign Out
      .addCase(signOut.fulfilled, (state) => {
        state.user = null
        state.profile = null
        state.isAuthenticated = false
        state.error = null
      })
      
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = !!action.payload
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false
        state.user = null
        state.isAuthenticated = false
      })
  }
})

export const { clearError, setAuthUser, setUserProfile, clearAuth } = authSlice.actions
export default authSlice.reducer
