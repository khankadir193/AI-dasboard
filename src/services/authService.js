import { supabase } from '../lib/supabaseClient'

class AuthService {
  // Authentication methods
  async signIn(email, password) {
    // Input validation
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required')
    }
    if (!password || typeof password !== 'string') {
      throw new Error('Password is required')
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid email address')
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Sign in failed:', error)
      throw this.handleAuthError(error)
    }
  }

  async signUp(email, password, metadata = {}) {
    // Input validation
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required')
    }
    if (!password || typeof password !== 'string') {
      throw new Error('Password is required')
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid email address')
    }
    
    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            company_name: metadata.company_name?.trim() || undefined,
            ...metadata
          }
        }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Sign up failed:', error)
      throw this.handleAuthError(error)
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return true
    } catch (error) {
      console.error('Sign out failed:', error)
      throw this.handleAuthError(error)
    }
  }

  async resetPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      return data
    } catch (error) {
      console.error('Password reset failed:', error)
      throw this.handleAuthError(error)
    }
  }

  async updatePassword(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (error) throw error
      return data
    } catch (error) {
      console.error('Password update failed:', error)
      throw this.handleAuthError(error)
    }
  }

  // User session methods
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error('Get current user failed:', error)
      throw this.handleAuthError(error)
    }
  }

  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Get session failed:', error)
      throw this.handleAuthError(error)
    }
  }

  // Session listeners
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }

  // Error handling
  handleAuthError(error) {
    const errorMessages = {
      'Invalid login credentials': 'Invalid email or password',
      'Email not confirmed': 'Please confirm your email address',
      'User already registered': 'An account with this email already exists',
      'Weak password': 'Password is too weak',
      'Invalid email': 'Please enter a valid email address',
      'Password should be at least 6 characters': 'Password must be at least 6 characters'
    }

    return errorMessages[error.message] || error.message || 'Authentication failed'
  }

  // Utility methods
  isAuthenticated() {
    return supabase.auth.getUser() !== null
  }

  async refreshToken() {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error
      return data
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw this.handleAuthError(error)
    }
  }
}

export const authService = new AuthService()
export default authService
