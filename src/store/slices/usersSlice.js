import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  fetchAllUsers as fetchAllUsersService,
  updateUserRole as updateUserRoleService,
  toggleUserStatus as toggleUserStatusService
} from '../../services/usersService'

// Async thunk for fetching ALL users with company data
export const fetchAllUsers = createAsyncThunk(
  'users/fetchAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAllUsersService()
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
      return await updateUserRoleService({ userId, role })
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
      return await toggleUserStatusService({ userId, is_active })
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
