import { Menu } from 'react-admin'
import {
  Building2,
  FileText,
  Search,
  Key,
  BarChart3,
  Wallet,
  Settings,
  Globe,
  Database,
  Server,
  TrendingUp,
  SearchX,
  Brain,
  MessageSquare,
  Target,
  BookA,
  Ban,
  Link2,
  Languages,
  Files,
  Activity
} from 'lucide-react'

export const CustomMenu = () => (
  <Menu>
    {/* Core Supabase Resources */}
    <Menu.Item
      to="/tenants"
      primaryText="Tenants"
      leftIcon={<Building2 size={20} />}
    />
    <Menu.Item
      to="/documents"
      primaryText="Documents"
      leftIcon={<FileText size={20} />}
    />
    <Menu.Item
      to="/search_logs"
      primaryText="Search Logs"
      leftIcon={<Search size={20} />}
    />
    <Menu.Item
      to="/tenant_api_keys"
      primaryText="API Keys"
      leftIcon={<Key size={20} />}
    />

    {/* Typesense Section */}
    <Menu.ResourceItem name="typesense-section" />

    {/* Collections & Documents */}
    <Menu.Item
      to="/typesense-collections"
      primaryText="Collections"
      leftIcon={<Database size={20} />}
    />
    <Menu.Item
      to="/typesense-documents"
      primaryText="TS Documents"
      leftIcon={<Files size={20} />}
    />

    {/* Search Features */}
    <Menu.Item
      to="/typesense-search"
      primaryText="Multi-Search"
      leftIcon={<SearchX size={20} />}
    />

    {/* Search Enhancement */}
    <Menu.Item
      to="/typesense-synonyms"
      primaryText="Synonyms"
      leftIcon={<BookA size={20} />}
    />
    <Menu.Item
      to="/typesense-curations"
      primaryText="Curations"
      leftIcon={<Target size={20} />}
    />
    <Menu.Item
      to="/typesense-stopwords"
      primaryText="Stopwords"
      leftIcon={<Ban size={20} />}
    />
    <Menu.Item
      to="/presets"
      primaryText="Search Presets"
      leftIcon={<Settings size={20} />}
    />
    <Menu.Item
      to="/typesense-stemming"
      primaryText="Stemming"
      leftIcon={<Languages size={20} />}
    />

    {/* Advanced Features */}
    <Menu.Item
      to="/typesense-nl-models"
      primaryText="NL Models"
      leftIcon={<Brain size={20} />}
    />
    <Menu.Item
      to="/typesense-conversations"
      primaryText="RAG Models"
      leftIcon={<MessageSquare size={20} />}
    />

    {/* Management */}
    <Menu.Item
      to="/typesense-aliases"
      primaryText="Aliases"
      leftIcon={<Link2 size={20} />}
    />
    <Menu.Item
      to="/typesense-keys"
      primaryText="TS API Keys"
      leftIcon={<Key size={20} />}
    />

    {/* Analytics & Monitoring */}
    <Menu.Item
      to="/typesense-analytics"
      primaryText="Analytics"
      leftIcon={<TrendingUp size={20} />}
    />
    <Menu.Item
      to="/typesense-system-dashboard"
      primaryText="System Status"
      leftIcon={<Server size={20} />}
    />
    <Menu.Item
      to="/typesense-system-metrics"
      primaryText="Metrics"
      leftIcon={<Activity size={20} />}
    />

    <Menu.ResourceItem name="analytics-section" />

    {/* Analytics & Usage */}
    <Menu.Item
      to="/tenant_usage"
      primaryText="Tenant Usage"
      leftIcon={<BarChart3 size={20} />}
    />

    {/* Billing */}
    <Menu.Item
      to="/billing_plans"
      primaryText="Billing Plans"
      leftIcon={<Wallet size={20} />}
    />

    {/* Integrations */}
    <Menu.Item
      to="/cms_integrations"
      primaryText="CMS Integrations"
      leftIcon={<Globe size={20} />}
    />
  </Menu>
)
