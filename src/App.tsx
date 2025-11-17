import { Admin, Resource, defaultTheme } from 'react-admin'
import { dataProvider } from './providers/dataProvider'
import { authProvider } from './providers/authProvider'
import { Dashboard } from './Dashboard'

// Resource imports
import { TenantList, TenantEdit, TenantCreate } from './resources/tenants'
import { DocumentList } from './resources/documents'
import { SearchLogList } from './resources/search-logs'
import { ApiKeyList } from './resources/api-keys'
import { UserList, UserEdit, UserCreate } from './resources/users'

// Icons from lucide-react
import {
  Building2,
  FileText,
  Search,
  Key,
  Users,
  BarChart3,
  Wallet,
  Settings,
  Globe
} from 'lucide-react'

// Custom theme based on shadcn
const theme = {
  ...defaultTheme,
  palette: {
    mode: 'light' as const,
    primary: {
      main: 'hsl(222.2, 47.4%, 11.2%)',
    },
    secondary: {
      main: 'hsl(210, 40%, 96.1%)',
    },
    background: {
      default: 'hsl(0, 0%, 100%)',
      paper: 'hsl(0, 0%, 100%)',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    ...defaultTheme.components,
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 500,
        },
      },
    },
  },
}

const App = () => (
  <Admin
    dataProvider={dataProvider}
    authProvider={authProvider}
    theme={theme}
    dashboard={Dashboard}
    requireAuth
  >
    {/* Core Resources */}
    <Resource
      name="tenants"
      list={TenantList}
      edit={TenantEdit}
      create={TenantCreate}
      icon={Building2}
      options={{ label: 'Tenants' }}
    />
    <Resource
      name="documents"
      list={DocumentList}
      icon={FileText}
      options={{ label: 'Documents' }}
    />
    <Resource
      name="search_logs"
      list={SearchLogList}
      icon={Search}
      options={{ label: 'Search Logs' }}
    />
    <Resource
      name="tenant_api_keys"
      list={ApiKeyList}
      icon={Key}
      options={{ label: 'API Keys' }}
    />

    {/* User Management */}
    <Resource
      name="user_tenants"
      icon={Users}
      options={{ label: 'User Tenants' }}
    />
    <Resource
      name="profiles"
      icon={Users}
      options={{ label: 'Profiles' }}
    />

    {/* Analytics & Usage */}
    <Resource
      name="tenant_usage"
      icon={BarChart3}
      options={{ label: 'Tenant Usage' }}
    />
    <Resource
      name="daily_usage_stats"
      icon={BarChart3}
      options={{ label: 'Daily Stats' }}
    />
    <Resource
      name="search_analytics"
      icon={BarChart3}
      options={{ label: 'Search Analytics' }}
    />

    {/* Billing */}
    <Resource
      name="billing_plans"
      icon={Wallet}
      options={{ label: 'Billing Plans' }}
    />
    <Resource
      name="tenant_billing"
      icon={Wallet}
      options={{ label: 'Tenant Billing' }}
    />

    {/* CMS & Integrations */}
    <Resource
      name="cms_integrations"
      icon={Globe}
      options={{ label: 'CMS Integrations' }}
    />
    <Resource
      name="cms_connections"
      icon={Globe}
      options={{ label: 'CMS Connections' }}
    />
    <Resource
      name="widgets"
      icon={Settings}
      options={{ label: 'Widgets' }}
    />
  </Admin>
)

export default App
