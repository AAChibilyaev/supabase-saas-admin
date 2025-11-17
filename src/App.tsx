import { Resource, defaultTheme } from 'react-admin'
import { Dashboard } from './Dashboard'
import { TenantProvider } from './contexts/TenantContext'
import { CustomLayout } from './components/layout/CustomLayout'
import { ThemeSelector } from './components/ThemeSelector'

// Resource imports
import { TenantList, TenantEdit, TenantCreate } from './resources/tenants'
import { DocumentList } from './resources/documents'
import { SearchLogList } from './resources/search-logs'
import { ApiKeyList } from './resources/api-keys'
import { InvitationList, InvitationCreate } from './resources/team-invitations'
import { TeamMemberList } from './resources/team-members'
import { ActivityFeed } from './resources/activity-logs'
import { SecurityList } from './resources/security'
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
import { StemmingDictionaryList, StemmingDictionaryImport, StemmingDictionaryView } from './resources/typesense-stemming'
import { ConversationModelList, ConversationModelCreate, ConversationModelEdit } from './resources/typesense-conversations'
import { NLModelList, NLModelEdit, NLModelCreate } from './resources/typesense-nl-models'
import { AnalyticsDashboard, AnalyticsRules, AnalyticsEvents } from './resources/typesense-analytics'
import {
  SystemDashboard,
  SystemMetrics,
  SystemOperations,
  SystemLogs
} from './resources/typesense-system'
import { MultiSearchForm } from './resources/typesense-search'
import { CollectionList, CollectionCreate, CollectionEdit, CollectionShow } from './resources/typesense-collections'
import {
  DocumentList as TypesenseDocumentList,
  DocumentCreate as TypesenseDocumentCreate,
  DocumentEdit as TypesenseDocumentEdit,
  DocumentShow as TypesenseDocumentShow,
} from './resources/typesense-documents'

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
  TrendingUp,
  Server,
  MessageSquare,
  Brain,
  Languages,
  SearchX,
  Database,
  Files,
  Mail,
  UserPlus,
  ListTree,
  ShieldCheck
} from 'lucide-react'

// Custom light theme based on shadcn
const lightTheme = {
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

// Custom dark theme based on shadcn
const darkTheme = {
  ...defaultTheme,
  palette: {
    mode: 'dark' as const,
    primary: {
      main: 'hsl(210, 40%, 98%)',
    },
    secondary: {
      main: 'hsl(217.2, 32.6%, 17.5%)',
    },
    background: {
      default: 'hsl(222.2, 84%, 4.9%)',
      paper: 'hsl(222.2, 84%, 4.9%)',
    },
    text: {
      primary: 'hsl(210, 40%, 98%)',
      secondary: 'hsl(215, 20.2%, 65.1%)',
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
    <ThemeSelector
      dashboard={Dashboard}
      layout={CustomLayout}
      lightTheme={lightTheme}
      darkTheme={darkTheme}
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
        name="typesense-collections"
        list={CollectionList}
        create={CollectionCreate}
        edit={CollectionEdit}
        show={CollectionShow}
        icon={Database}
        options={{ label: 'Collections' }}
      />
      <Resource
        name="typesense-documents"
        list={TypesenseDocumentList}
        create={TypesenseDocumentCreate}
        edit={TypesenseDocumentEdit}
        show={TypesenseDocumentShow}
        icon={Files}
        options={{ label: 'Documents' }}
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
        name="typesense-stemming"
        list={StemmingDictionaryList}
        create={StemmingDictionaryImport}
        show={StemmingDictionaryView}
        icon={Languages}
        options={{ label: 'Stemming Dictionaries' }}
      />
      <Resource
        name="typesense-aliases"
        list={AliasList}
        edit={AliasEdit}
        create={AliasCreate}
        icon={Link2}
        options={{ label: 'Collection Aliases' }}
      />
      <Resource
        name="typesense-conversations"
        list={ConversationModelList}
        edit={ConversationModelEdit}
        create={ConversationModelCreate}
        icon={MessageSquare}
        options={{ label: 'Conversation Models (RAG)' }}
      />
      <Resource
        name="typesense-nl-models"
        list={NLModelList}
        edit={NLModelEdit}
        create={NLModelCreate}
        icon={Brain}
        options={{ label: 'NL Search Models' }}
      />
      <Resource
        name="typesense-search"
        list={MultiSearchForm}
        icon={SearchX}
        options={{ label: 'Multi-Search' }}
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

      {/* System Operations & Monitoring */}
      <Resource
        name="typesense-system-dashboard"
        list={SystemDashboard}
        icon={Server}
        options={{ label: 'System Dashboard' }}
      />
      <Resource
        name="typesense-system-metrics"
        list={SystemMetrics}
        icon={Activity}
        options={{ label: 'System Metrics' }}
      />
      <Resource
        name="typesense-system-operations"
        list={SystemOperations}
        icon={Settings}
        options={{ label: 'System Operations' }}
      />
      <Resource
        name="typesense-system-logs"
        list={SystemLogs}
        icon={FileText}
        options={{ label: 'System Logs' }}
      />

      {/* Hidden resource for system operations data */}
      <Resource name="typesense-system" />

      {/* Team Management */}
      <Resource
        name="team_invitations"
        list={InvitationList}
        create={InvitationCreate}
        icon={Mail}
        options={{ label: 'Team Invitations' }}
      />
      <Resource
        name="team-members"
        list={TeamMemberList}
        icon={UserPlus}
        options={{ label: 'Team Members' }}
      />
      <Resource
        name="audit_logs"
        list={ActivityFeed}
        icon={ListTree}
        options={{ label: 'Activity Feed' }}
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

      {/* Security Settings */}
      <Resource
        name="security"
        list={SecurityList}
        icon={ShieldCheck}
        options={{ label: 'Security Settings' }}
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
    </ThemeSelector>
  </TenantProvider>
)

export default App
