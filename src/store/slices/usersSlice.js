import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  fetchAllUsers as fetchAllUsersService,
  updateUserRole as updateUserRoleService,
  updateMemberStatus as updateMemberStatusService,
  removeMember as removeMemberService
} from '../../services/usersService'

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

export const updateUserRole = createAsyncThunk(
  'users/updateUserRole',
  async ({ userId, role, companyId }, { rejectWithValue }) => {
    try {
      return await updateUserRoleService({ userId, role, companyId })
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateMemberStatus = createAsyncThunk(
  'users/updateMemberStatus',
  async ({ userId, status, companyId }, { rejectWithValue }) => {
    try {
      return await updateMemberStatusService({ userId, status, companyId })
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const removeMember = createAsyncThunk(
  'users/removeMember',
  async ({ userId, companyId }, { rejectWithValue }) => {
    try {
      await removeMemberService({ userId, companyId })
      return { userId }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

/** @deprecated */
export const toggleUserStatus = createAsyncThunk(
  'users/toggleUserStatus',
  async ({ userId, is_active, companyId }, { rejectWithValue }) => {
    try {
      return await updateMemberStatusService({
        userId,
        status: is_active ? 'active' : 'inactive',
        companyId
      })
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
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
      .addCase(updateUserRole.fulfilled, (state, action) => {
        const updated = action.payload
        const index = state.users.findIndex((u) => u.id === updated.id)
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...updated }
        }
      })
      .addCase(updateMemberStatus.fulfilled, (state, action) => {
        const updated = action.payload
        const index = state.users.findIndex((u) => u.id === updated.id)
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...updated }
        }
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload.userId)
        state.totalCount = state.users.length
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        const updated = action.payload
        const index = state.users.findIndex((u) => u.id === updated.id)
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...updated }
        }
      })
  }
})

export const { clearUsersError, clearUsers } = usersSlice.actions
export default usersSlice.reducer
