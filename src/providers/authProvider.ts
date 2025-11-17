import type { AuthProvider } from 'react-admin'
import { supabaseAuthProvider } from 'ra-supabase'
import { supabaseClient } from './supabaseClient'

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
})
