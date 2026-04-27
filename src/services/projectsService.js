import { supabase } from '../lib/supabaseClient'

/**
 * Projects Service
 * Handles all project-related API calls with multi-tenant isolation.
 * company_id is ALWAYS derived dynamically from the logged-in user's profile.
 */

/**
 * Fetch the current authenticated user from Supabase Auth
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw new Error(`Auth error: ${error.message}`)
  if (!user) throw new Error('No authenticated user found')
  return user
}

/**
 * Fetch user profile including company_id and role
 */
export const getUserProfile = async (userId) => {
  if (!userId) throw new Error('User ID is required')

  const { data, error } = await supabase
    .from('profiles')
    .select('id, company_id, role')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Profile fetch error: ${error.message}`)
  }

  if (!data) {
    throw new Error('User profile not found')
  }

  if (!data.company_id) {
    throw new Error('No company associated with your account. Please contact support.')
  }

  return data
}

/**
 * Fetch projects for the current user's company
 * Automatically derives company_id from the user's profile
 */
export const fetchProjects = async (filters = {}) => {
  // 1. Get current user
  const user = await getCurrentUser()

  // 2. Get user profile to extract company_id
  const profile = await getUserProfile(user.id)
  const companyId = profile.company_id

  // 3. Build query with tenant isolation
  let query = supabase
    .from('projects')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  // 4. Apply optional filters
  if (filters.status && ['active', 'inactive'].includes(filters.status)) {
    query = query.eq('status', filters.status)
  }

  if (filters.search && filters.search.trim().length > 0) {
    query = query.ilike('name', `%${filters.search.trim()}%`)
  }

  const { data, error } = await query

  if (error) {
    if (error.code === 'PGRST116') {
      return [] // No projects found
    }
    throw new Error(`Failed to fetch projects: ${error.message}`)
  }

  return data || []
}

/**
 * Create a new project for the current user's company
 * Automatically derives company_id from the user's profile
 */
export const createProject = async (name) => {
  // Validate input
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Project name is required')
  }
  if (name.trim().length < 2) {
    throw new Error('Project name must be at least 2 characters')
  }
  if (name.trim().length > 100) {
    throw new Error('Project name must be less than 100 characters')
  }
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name.trim())) {
    throw new Error('Project name can only contain letters, numbers, spaces, hyphens, and underscores')
  }

  // Get current user and profile
  const user = await getCurrentUser()
  const profile = await getUserProfile(user.id)

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: name.trim(),
      company_id: profile.company_id,
      status: 'active'
    })
    .select()
    .maybeSingle()

  if (error) {
    if (error.code === '23505') {
      throw new Error('A project with this name already exists')
    }
    if (error.code === '23503') {
      throw new Error('Invalid company reference')
    }
    throw new Error(`Failed to create project: ${error.message}`)
  }

  if (!data) {
    throw new Error('Failed to create project')
  }

  return data
}

/**
 * Delete a project by ID
 * RLS enforces that users can only delete projects in their own company
 */
export const deleteProject = async (projectId) => {
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('Project ID is required')
  }

  const { data, error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .select()
    .maybeSingle()

  if (error) {
    if (error.code === '42501') {
      throw new Error('You do not have permission to delete this project')
    }
    throw new Error(`Failed to delete project: ${error.message}`)
  }

  if (!data) {
    throw new Error('Project not found or already deleted')
  }

  return data
}

/**
 * Update a project by ID
 * RLS enforces that users can only update projects in their own company
 */
export const updateProject = async (projectId, updates) => {
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('Project ID is required')
  }
  if (!updates || typeof updates !== 'object') {
    throw new Error('Updates object is required')
  }

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .maybeSingle()

  if (error) {
    if (error.code === '42501') {
      throw new Error('You do not have permission to update this project')
    }
    throw new Error(`Failed to update project: ${error.message}`)
  }

  if (!data) {
    throw new Error('Project not found')
  }

  return data
}

/**
 * Get the current user's role
 * Useful for UI conditional rendering (e.g., admin-only buttons)
 */
export const getCurrentUserRole = async () => {
  const user = await getCurrentUser()
  const profile = await getUserProfile(user.id)
  return profile.role
}

