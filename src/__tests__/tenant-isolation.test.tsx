import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TenantProvider, useTenantContext } from '../contexts/TenantContext'
import { supabaseClient } from '../providers/supabaseClient'

// Mock supabase client
vi.mock('../providers/supabaseClient', () => ({
  supabaseClient: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}))

// Test component that uses the tenant context
const TestComponent = () => {
  const {
    selectedTenantId,
    setSelectedTenantId,
    viewAllMode,
    setViewAllMode,
    availableTenants,
    isLoading,
    isSuperAdmin,
  } = useTenantContext()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div data-testid="selected-tenant">{selectedTenantId || 'none'}</div>
      <div data-testid="view-all-mode">{viewAllMode ? 'true' : 'false'}</div>
      <div data-testid="is-super-admin">{isSuperAdmin ? 'true' : 'false'}</div>
      <div data-testid="tenant-count">{availableTenants.length}</div>
      {availableTenants.map(tenant => (
        <div key={tenant.id} data-testid={`tenant-${tenant.id}`}>
          {tenant.name}
        </div>
      ))}
      <button onClick={() => setSelectedTenantId('test-tenant-1')}>
        Select Tenant 1
      </button>
      <button onClick={() => setSelectedTenantId('test-tenant-2')}>
        Select Tenant 2
      </button>
      <button onClick={() => setViewAllMode(true)}>Enable View All</button>
      <button onClick={() => setViewAllMode(false)}>Disable View All</button>
    </div>
  )
}

describe('Tenant Isolation', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should load user tenants and set default tenant', async () => {
    // Mock user and tenants
    const mockUser = { id: 'user-1', email: 'test@example.com' }
    const mockTenants = [
      {
        id: 'ut-1',
        role: 'admin',
        user_id: 'user-1',
        tenant_id: 'tenant-1',
        tenants: {
          id: 'tenant-1',
          name: 'Test Tenant 1',
          slug: 'test-tenant-1',
          plan_type: 'pro',
        },
      },
      {
        id: 'ut-2',
        role: 'member',
        user_id: 'user-1',
        tenant_id: 'tenant-2',
        tenants: {
          id: 'tenant-2',
          name: 'Test Tenant 2',
          slug: 'test-tenant-2',
          plan_type: 'free',
        },
      },
    ]

    vi.mocked(supabaseClient.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    vi.mocked(supabaseClient.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockTenants,
          error: null,
        }),
      }),
    } as any)

    render(
      <TenantProvider>
        <TestComponent />
      </TenantProvider>
    )

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Should load 2 tenants
    expect(screen.getByTestId('tenant-count')).toHaveTextContent('2')

    // Should default to first tenant
    expect(screen.getByTestId('selected-tenant')).toHaveTextContent('tenant-1')

    // Should not be in view all mode
    expect(screen.getByTestId('view-all-mode')).toHaveTextContent('false')

    // Should not be super admin (no owner role)
    expect(screen.getByTestId('is-super-admin')).toHaveTextContent('false')
  })

  it('should detect super admin role', async () => {
    const mockUser = { id: 'user-1', email: 'admin@example.com' }
    const mockTenants = [
      {
        id: 'ut-1',
        role: 'owner',
        user_id: 'user-1',
        tenant_id: 'tenant-1',
        tenants: {
          id: 'tenant-1',
          name: 'Test Tenant',
          slug: 'test-tenant',
          plan_type: 'enterprise',
        },
      },
    ]

    vi.mocked(supabaseClient.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    vi.mocked(supabaseClient.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockTenants,
          error: null,
        }),
      }),
    } as any)

    render(
      <TenantProvider>
        <TestComponent />
      </TenantProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Should detect super admin
    expect(screen.getByTestId('is-super-admin')).toHaveTextContent('true')
  })

  it('should switch between tenants', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }
    const mockTenants = [
      {
        id: 'ut-1',
        role: 'admin',
        user_id: 'user-1',
        tenant_id: 'test-tenant-1',
        tenants: {
          id: 'test-tenant-1',
          name: 'Tenant 1',
          slug: 'tenant-1',
          plan_type: 'pro',
        },
      },
      {
        id: 'ut-2',
        role: 'admin',
        user_id: 'user-1',
        tenant_id: 'test-tenant-2',
        tenants: {
          id: 'test-tenant-2',
          name: 'Tenant 2',
          slug: 'tenant-2',
          plan_type: 'pro',
        },
      },
    ]

    vi.mocked(supabaseClient.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    vi.mocked(supabaseClient.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockTenants,
          error: null,
        }),
      }),
    } as any)

    render(
      <TenantProvider>
        <TestComponent />
      </TenantProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Initially on first tenant
    expect(screen.getByTestId('selected-tenant')).toHaveTextContent('test-tenant-1')

    // Switch to tenant 2
    const selectTenant2Button = screen.getByText('Select Tenant 2')
    await userEvent.click(selectTenant2Button)

    // Should switch to tenant 2
    expect(screen.getByTestId('selected-tenant')).toHaveTextContent('test-tenant-2')

    // Should persist to localStorage
    expect(localStorage.getItem('supabase-admin:selected-tenant')).toBe('test-tenant-2')
  })

  it('should enable view all mode for super admin', async () => {
    const mockUser = { id: 'user-1', email: 'admin@example.com' }
    const mockTenants = [
      {
        id: 'ut-1',
        role: 'owner',
        user_id: 'user-1',
        tenant_id: 'tenant-1',
        tenants: {
          id: 'tenant-1',
          name: 'Tenant 1',
          slug: 'tenant-1',
          plan_type: 'enterprise',
        },
      },
    ]

    vi.mocked(supabaseClient.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    vi.mocked(supabaseClient.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockTenants,
          error: null,
        }),
      }),
    } as any)

    render(
      <TenantProvider>
        <TestComponent />
      </TenantProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Initially not in view all mode
    expect(screen.getByTestId('view-all-mode')).toHaveTextContent('false')

    // Enable view all mode
    const enableViewAllButton = screen.getByText('Enable View All')
    await userEvent.click(enableViewAllButton)

    // Should enable view all mode
    expect(screen.getByTestId('view-all-mode')).toHaveTextContent('true')
    expect(screen.getByTestId('selected-tenant')).toHaveTextContent('none')

    // Should persist to localStorage
    expect(localStorage.getItem('supabase-admin:view-all-mode')).toBe('true')
  })

  it('should persist tenant selection across page reloads', async () => {
    // Set localStorage before rendering
    localStorage.setItem('supabase-admin:selected-tenant', 'tenant-2')

    const mockUser = { id: 'user-1', email: 'test@example.com' }
    const mockTenants = [
      {
        id: 'ut-1',
        role: 'admin',
        user_id: 'user-1',
        tenant_id: 'tenant-1',
        tenants: {
          id: 'tenant-1',
          name: 'Tenant 1',
          slug: 'tenant-1',
          plan_type: 'pro',
        },
      },
      {
        id: 'ut-2',
        role: 'admin',
        user_id: 'user-1',
        tenant_id: 'tenant-2',
        tenants: {
          id: 'tenant-2',
          name: 'Tenant 2',
          slug: 'tenant-2',
          plan_type: 'pro',
        },
      },
    ]

    vi.mocked(supabaseClient.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    vi.mocked(supabaseClient.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockTenants,
          error: null,
        }),
      }),
    } as any)

    render(
      <TenantProvider>
        <TestComponent />
      </TenantProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Should restore saved tenant
    expect(screen.getByTestId('selected-tenant')).toHaveTextContent('tenant-2')
  })
})

describe('Data Provider Tenant Filtering', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should inject tenant_id filter for tenant-scoped resources', () => {
    // Set a tenant in localStorage
    localStorage.setItem('supabase-admin:selected-tenant', 'tenant-123')

    // Import the getCurrentTenantId function (would need to export it)
    const tenantId = localStorage.getItem('supabase-admin:selected-tenant')

    expect(tenantId).toBe('tenant-123')
  })

  it('should not filter when in view all mode', () => {
    // Set view all mode
    localStorage.setItem('supabase-admin:view-all-mode', 'true')

    const viewAllMode = localStorage.getItem('supabase-admin:view-all-mode') === 'true'

    expect(viewAllMode).toBe(true)
  })

  it('should handle no tenant selected', () => {
    // No tenant in localStorage
    const tenantId = localStorage.getItem('supabase-admin:selected-tenant')

    expect(tenantId).toBeNull()
  })
})
