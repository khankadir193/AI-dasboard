import { supabase } from '../lib/supabaseClient'

// Base API service configuration
class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://dhmogbhjsrvatseivdlb.supabase.co'
    this.timeout = 10000 // 10 seconds
  }

  // Generic request wrapper with error handling
  async request(method, endpoint, data = null, options = {}) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    if (data) {
      config.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API ${method} ${endpoint} failed:`, error)
      throw error
    }
  }

  // HTTP methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.request('GET', url)
  }

  async post(endpoint, data) {
    return this.request('POST', endpoint, data)
  }

  async put(endpoint, data) {
    return this.request('PUT', endpoint, data)
  }

  async patch(endpoint, data) {
    return this.request('PATCH', endpoint, data)
  }

  async delete(endpoint) {
    return this.request('DELETE', endpoint)
  }

  // Supabase specific methods
  async getSupabaseUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // Utility methods
  handleApiError(error) {
    if (error.code === 'PGRST116') {
      return 'No data found'
    }
    if (error.code === '42501') {
      return 'Permission denied'
    }
    if (error.code === '23505') {
      return 'Duplicate entry'
    }
    return error.message || 'An error occurred'
  }
}

export const apiService = new ApiService()
export default apiService
