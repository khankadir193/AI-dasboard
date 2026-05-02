import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabaseClient'

// Sign out - only calls Supabase signOut, auth listener will clear state
export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: true
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
      state.loading = false
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    clearUser: (state) => {
      state.user = null
      state.loading = false
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(signOut.fulfilled, (state) => {
        // Don't manually clear - let the auth listener handle it
        // This ensures consistency across all signed-out scenarios
        state.loading = false
      })
      .addCase(signOut.rejected, (state) => {
        state.loading = false
      })
  }
})

export const { setUser, setLoading, clearUser } = authSlice.actions
export default authSlice.reducer
