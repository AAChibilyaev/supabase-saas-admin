import { Admin, Resource, defaultTheme } from 'react-admin'
import { compositeDataProvider } from './providers/compositeDataProvider'
import { authProvider } from './providers/authProvider'
import { Dashboard } from './Dashboard'
import { TenantProvider } from './contexts/TenantContext'
import { CustomLayout } from './components/layout/CustomLayout'

// Resource imports
import { TenantList, TenantEdit, TenantCreate } from './resources/tenants'
import { DocumentList } from './resources/documents'
import { SearchLogList } from './resources/search-logs'
import { ApiKeyList } from './resources/api-keys'
import { UserList, UserEdit, UserCreate } from './resources/users'
import {
  ApiKeyList as TypesenseApiKeyList,
  ApiKeyCreate as TypesenseApiKeyCreate,
  ApiKeyShow as TypesenseApiKeyShow
} from './resources/typesense-api-keys'
import { PresetList, PresetEdit, PresetCreate } from './resources/typesense-presets'
import { CurationSetList, CurationSetEdit, CurationSetCreate } from './resources/typesense-curations'
import { SynonymSetList, SynonymSetEdit, SynonymSetCreate } from './resources/typesense-synonyms'
import { StopwordsList, StopwordsEdit, StopwordsCreate } from './resources/typesense-stopwords'
import { AliasList, AliasEdit, AliasCreate } from './resources/typesense-aliases'
import { AnalyticsDashboard, AnalyticsRules, AnalyticsEvents } from './resources/typesense-analytics'

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
  Globe,
  Target,
  BookA,
  Ban,
  Link2,
  Activity,
  TrendingUp
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
  <TenantProvider>
    <Admin
      dataProvider={compositeDataProvider}
      authProvider={authProvider}
      theme={theme}
      dashboard={Dashboard}
      layout={CustomLayout}
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
      <Resource
        name="typesense-keys"
        list={TypesenseApiKeyList}
        create={TypesenseApiKeyCreate}
        show={TypesenseApiKeyShow}
        icon={Key}
        options={{ label: 'Typesense API Keys' }}
      />
      <Resource
        name="presets"
        list={PresetList}
        edit={PresetEdit}
        create={PresetCreate}
        icon={Settings}
        options={{ label: 'Search Presets' }}
      />
      <Resource
        name="typesense-curations"
        list={CurationSetList}
        edit={CurationSetEdit}
        create={CurationSetCreate}
        icon={Target}
        options={{ label: 'Curation Sets' }}
      />
      <Resource
        name="typesense-synonyms"
        list={SynonymSetList}
        edit={SynonymSetEdit}
        create={SynonymSetCreate}
        icon={BookA}
        options={{ label: 'Synonym Sets' }}
      />
      <Resource
        name="typesense-stopwords"
        list={StopwordsList}
        edit={StopwordsEdit}
        create={StopwordsCreate}
        icon={Ban}
        options={{ label: 'Stopwords' }}
      />
      <Resource
        name="typesense-aliases"
        list={AliasList}
        edit={AliasEdit}
        create={AliasCreate}
        icon={Link2}
        options={{ label: 'Collection Aliases' }}
      />

      {/* Typesense Analytics */}
      <Resource
        name="typesense-analytics"
        list={AnalyticsDashboard}
        icon={TrendingUp}
        options={{ label: 'Analytics Dashboard' }}
      />
      <Resource
        name="typesense-analytics-rules"
        list={AnalyticsRules}
        icon={Settings}
        options={{ label: 'Analytics Rules' }}
      />
      <Resource
        name="typesense-analytics-events"
        list={AnalyticsEvents}
        icon={Activity}
        options={{ label: 'Analytics Events' }}
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
  </TenantProvider>
)

export default App
