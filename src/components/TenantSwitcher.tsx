import React from 'react'
import { Building2, Globe } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { useTenantContext } from '../contexts/TenantContext'

export const TenantSwitcher: React.FC = () => {
  const {
    selectedTenantId,
    setSelectedTenantId,
    viewAllMode,
    setViewAllMode,
    availableTenants,
    isLoading,
    isSuperAdmin,
  } = useTenantContext()

  // Don't render if loading
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Loading tenants...</span>
      </div>
    )
  }

  // Don't render if no tenants available
  if (availableTenants.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>No tenants</span>
      </div>
    )
  }

  // Get current value for the select
  const currentValue = viewAllMode ? 'view-all' : selectedTenantId || ''

  // Handle selection change
  const handleValueChange = (value: string) => {
    if (value === 'view-all') {
      setViewAllMode(true)
    } else {
      setSelectedTenantId(value)
    }
  }

  // Get current tenant name for display
  const getCurrentLabel = () => {
    if (viewAllMode) {
      return 'All Tenants'
    }
    const currentTenant = availableTenants.find(t => t.id === selectedTenantId)
    return currentTenant?.name || 'Select Tenant'
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={currentValue} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[200px] h-9">
          <SelectValue>
            <div className="flex items-center gap-2">
              {viewAllMode && <Globe className="h-3 w-3" />}
              <span className="truncate">{getCurrentLabel()}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {isSuperAdmin && (
            <>
              <SelectItem value="view-all">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>All Tenants</span>
                </div>
              </SelectItem>
              <div className="h-px bg-border my-1" />
            </>
          )}
          {availableTenants.map(tenant => (
            <SelectItem key={tenant.id} value={tenant.id}>
              <div className="flex flex-col">
                <span className="font-medium">{tenant.name}</span>
                <span className="text-xs text-muted-foreground">
                  {tenant.slug} • {tenant.plan_type}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
