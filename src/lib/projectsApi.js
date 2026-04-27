import { supabase } from './supabaseClient'

// Step 3: Create Project API
export const createProject = async (name, company_id) => {
  // Edge case: Validate inputs
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Project name is required')
  }
  if (!company_id || typeof company_id !== 'string') {
    throw new Error('Company ID is required')
  }
  if (name.trim().length > 100) {
    throw new Error('Project name must be less than 100 characters')
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: name.trim(),
        company_id,
        status: "active"
      })
      .select()
      .maybeSingle()

    if (error) {
      // Handle specific Supabase errors
      if (error.code === '23505') {
        throw new Error('A project with this name already exists')
      }
      if (error.code === '23503') {
        throw new Error('Invalid company ID')
      }
      throw error
    }
    
    if (!data) {
      throw new Error('Failed to create project')
    }
    
    return data
  } catch (error) {
    console.error('Error creating project:', error)
    throw error
  }
}

// Step 4: Fetch Projects
export const getProjects = async (company_id) => {
  // Edge case: Validate input
  if (!company_id || typeof company_id !== 'string') {
    throw new Error('Company ID is required')
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("company_id", company_id)
      .order('created_at', { ascending: false })

    if (error) {
      // Handle specific Supabase errors
      if (error.code === 'PGRST116') {
        return [] // No projects found, return empty array
      }
      throw error
    }
    
    return data || [] // Always return array, never null
  } catch (error) {
    console.error('Error fetching projects:', error)
    throw error
  }
}

// Delete Project (admin only)
export const deleteProject = async (projectId) => {
  // Edge case: Validate input
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('Project ID is required')
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .select()
      .maybeSingle()

    if (error) {
      // Handle specific Supabase errors
      if (error.code === 'PGRST116') {
        throw new Error('Project not found')
      }
      if (error.code === '42501') {
        throw new Error('You do not have permission to delete this project')
      }
      throw error
    }
    
    if (!data) {
      throw new Error('Failed to delete project')
    }
    
    return data
  } catch (error) {
    console.error('Error deleting project:', error)
    throw error
  }
}

// Update Project Status
export const updateProjectStatus = async (projectId, status) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .update({ status })
      .eq("id", projectId)
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('Project not found')
    return data
  } catch (error) {
    console.error('Error updating project status:', error)
    throw error
  }
}

// Get Single Project
export const getProject = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('Project not found')
    return data
  } catch (error) {
    console.error('Error fetching project:', error)
    throw error
  }
}
