import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

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

// Specific hooks for the dashboard
export function useUsers() {
  return useFetch('users', '/users')
}

export function usePosts() {
  return useFetch('posts', '/posts')
}

export function useTodos() {
  return useFetch('todos', '/todos')
}
