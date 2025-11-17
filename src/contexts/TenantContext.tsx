import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { supabaseClient } from '../providers/supabaseClient'

export interface Tenant {
  id: string
  name: string
  slug: string
  plan_type: string
}

export interface TenantContextType {
  selectedTenantId: string | null
  setSelectedTenantId: (id: string | null) => void
  viewAllMode: boolean
  setViewAllMode: (enabled: boolean) => void
  availableTenants: Tenant[]
  isLoading: boolean
  isSuperAdmin: boolean
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

const STORAGE_KEY = 'supabase-admin:selected-tenant'
const VIEW_ALL_KEY = 'supabase-admin:view-all-mode'

interface TenantProviderProps {
  children: ReactNode
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [selectedTenantId, setSelectedTenantIdState] = useState<string | null>(null)
  const [viewAllMode, setViewAllModeState] = useState<boolean>(false)
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  // Load user's accessible tenants and determine if super admin
  useEffect(() => {
    const loadTenants = async () => {
      try {
        setIsLoading(true)

        // Check if user has an active session first
        const { data: sessionData } = await supabaseClient.auth.getSession()
        if (!sessionData?.session) {
          // No active session - user is not authenticated, this is normal
          setIsLoading(false)
          return
        }

        // Get current user
        const { data: userData, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !userData.user) {
          // Only log non-session errors
          if (userError?.name !== 'AuthSessionMissingError') {
            console.error('Error getting user:', userError)
          }
          setIsLoading(false)
          return
        }

        // Check if user is super admin (owner role with no specific tenant restriction)
        const { data: userTenants, error: userTenantsError } = await supabaseClient
          .from('user_tenants')
          .select('id, role, tenant_id, tenants(id, name, slug, plan_type)')
          .eq('user_id', userData.user.id)

        if (userTenantsError) {
          console.error('Error loading user tenants:', userTenantsError)
          setIsLoading(false)
          return
        }

        // Check if user has owner role - these are super admins
        const hasOwnerRole = userTenants?.some(ut => ut.role === 'owner')
        setIsSuperAdmin(hasOwnerRole || false)

        // Extract tenants from user_tenants relationship
        const tenants: Tenant[] = (userTenants || [])
          .filter((ut): ut is typeof ut & { tenants: NonNullable<typeof ut.tenants> } => !!ut.tenants)
          .map(ut => ({
            id: ut.tenants.id,
            name: ut.tenants.name,
            slug: ut.tenants.slug,
            plan_type: ut.tenants.plan_type,
          }))

        setAvailableTenants(tenants)

        // Restore saved tenant selection from localStorage
        const savedTenantId = localStorage.getItem(STORAGE_KEY)
        const savedViewAllMode = localStorage.getItem(VIEW_ALL_KEY) === 'true'

        // Validate saved tenant ID exists in available tenants
        if (savedTenantId && tenants.some(t => t.id === savedTenantId)) {
          setSelectedTenantIdState(savedTenantId)
          setViewAllModeState(false)
        } else if (savedViewAllMode && hasOwnerRole) {
          // Restore view all mode only if user is super admin
          setViewAllModeState(true)
          setSelectedTenantIdState(null)
        } else if (tenants.length > 0) {
          // Default to first tenant if no valid saved selection
          setSelectedTenantIdState(tenants[0].id)
          setViewAllModeState(false)
        }
      } catch (error) {
        console.error('Error in loadTenants:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTenants()
  }, [])

  // Persist tenant selection to localStorage
  const setSelectedTenantId = (id: string | null) => {
    setSelectedTenantIdState(id)
    if (id) {
      localStorage.setItem(STORAGE_KEY, id)
      localStorage.removeItem(VIEW_ALL_KEY)
      setViewAllModeState(false)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Persist view all mode to localStorage
  const setViewAllMode = (enabled: boolean) => {
    setViewAllModeState(enabled)
    if (enabled) {
      localStorage.setItem(VIEW_ALL_KEY, 'true')
      localStorage.removeItem(STORAGE_KEY)
      setSelectedTenantIdState(null)
    } else {
      localStorage.removeItem(VIEW_ALL_KEY)
      // Default to first tenant when disabling view all
      if (availableTenants.length > 0) {
        setSelectedTenantId(availableTenants[0].id)
      }
    }
  }

  const value: TenantContextType = {
    selectedTenantId,
    setSelectedTenantId,
    viewAllMode,
    setViewAllMode,
    availableTenants,
    isLoading,
    isSuperAdmin,
  }

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

  export const useTenantContext = (): TenantContextType => {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenantContext must be used within a TenantProvider')
  }
  return context
}
