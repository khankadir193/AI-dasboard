import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import profileSlice from './slices/profileSlice'
import tenantSlice from './slices/tenantSlice'
import projectsSlice from './slices/projectsSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    profile: profileSlice,
    tenant: tenantSlice,
    projects: projectsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export default store
