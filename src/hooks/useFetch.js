import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAllUsers } from '../store/slices/usersSlice'

const api = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com', // Free mock REST API
  timeout: 10000,
})

// Generic fetch hook
export function useFetch(key, url, options = {}) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const { data } = await api.get(url)
      return data
    },
    ...options,
  })
}

// Redux-based users hook - fetches from Supabase via Redux
export function useUsers() {
  const dispatch = useDispatch()
  
  // Get users from Redux store
  const { users, isLoading, error } = useSelector(state => state.users)

  // Fetch users on mount
  useEffect(() => {
    dispatch(fetchAllUsers())
  }, [dispatch])

  // Return in same format as before for compatibility
  return {
    data: users,
    isLoading,
    error
  }
}

// Legacy hooks for other data
export function useUsersLegacy() {
  return useFetch('users', '/users')
}

export function usePosts() {
  return useFetch('posts', '/posts')
}

export function useTodos() {
  return useFetch('todos', '/todos')
}
