import type { AuthProvider } from 'react-admin'
import { supabaseAuthProvider } from 'ra-supabase'
import { supabaseClient } from './supabaseClient'
import { createUserPermissions, type UserRole } from '../types/permissions'

export const authProvider: AuthProvider = supabaseAuthProvider(supabaseClient, {
  getIdentity: async () => {
    const { data } = await supabaseClient.auth.getUser()

    if (!data.user) {
      throw new Error('Not authenticated')
    }

    return {
      id: data.user.id,
      fullName: data.user.email,
      avatar: data.user.user_metadata?.avatar_url,
    }
  },
  getPermissions: async () => {
    const { data: userData } = await supabaseClient.auth.getUser()

    if (!userData.user) {
      throw new Error('Not authenticated')
    }

    // Get the user's role from user_tenants table
    // For multi-tenant support, we get the first tenant or could be extended to handle multiple
    const { data: userTenant, error } = await supabaseClient
      .from('user_tenants')
      .select('role, tenant_id')
      .eq('user_id', userData.user.id)
      .single()

    if (error) {
      console.error('Error fetching user permissions:', error)
      // Default to readonly if no tenant association found
      return createUserPermissions('readonly', '', userData.user.id)
    }

    const role = (userTenant.role || 'readonly') as UserRole
    const tenantId = userTenant.tenant_id

    return createUserPermissions(role, tenantId, userData.user.id)
  },
})
