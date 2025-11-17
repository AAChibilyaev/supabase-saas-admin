import type { Database } from './database.types'

// Generic type helpers for easy access to table types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

// Specific table types for common use
export type Tenant = Tables<'tenants'>
export type TenantInsert = Inserts<'tenants'>
export type TenantUpdate = Updates<'tenants'>

export type Document = Tables<'documents'>
export type DocumentInsert = Inserts<'documents'>
export type DocumentUpdate = Updates<'documents'>

export type SearchLog = Tables<'search_logs'>
export type SearchLogInsert = Inserts<'search_logs'>
export type SearchLogUpdate = Updates<'search_logs'>

export type SearchQueryLog = Tables<'search_queries_log'>
export type SearchQueryLogInsert = Inserts<'search_queries_log'>
export type SearchQueryLogUpdate = Updates<'search_queries_log'>

export type ApiKey = Tables<'tenant_api_keys'>
export type ApiKeyInsert = Inserts<'tenant_api_keys'>
export type ApiKeyUpdate = Updates<'tenant_api_keys'>

export type BillingPlan = Tables<'billing_plans'>
export type BillingPlanInsert = Inserts<'billing_plans'>
export type BillingPlanUpdate = Updates<'billing_plans'>

export type UserTenant = Tables<'user_tenants'>
export type UserTenantInsert = Inserts<'user_tenants'>
export type UserTenantUpdate = Updates<'user_tenants'>

export type Profile = Tables<'profiles'>
export type ProfileInsert = Inserts<'profiles'>
export type ProfileUpdate = Updates<'profiles'>

export type AuditLog = Tables<'audit_logs'>
export type AuditLogInsert = Inserts<'audit_logs'>
export type AuditLogUpdate = Updates<'audit_logs'>

export type TenantUsage = Tables<'tenant_usage'>
export type TenantUsageInsert = Inserts<'tenant_usage'>
export type TenantUsageUpdate = Updates<'tenant_usage'>

export type TenantBilling = Tables<'tenant_billing'>
export type TenantBillingInsert = Inserts<'tenant_billing'>
export type TenantBillingUpdate = Updates<'tenant_billing'>

export type TeamInvitation = Tables<'team_invitations'>
export type TeamInvitationInsert = Inserts<'team_invitations'>
export type TeamInvitationUpdate = Updates<'team_invitations'>

export type SyncError = Tables<'sync_errors'>
export type SyncErrorInsert = Inserts<'sync_errors'>
export type SyncErrorUpdate = Updates<'sync_errors'>

export type SearchAnalytics = Tables<'search_analytics'>
export type SearchAnalyticsInsert = Inserts<'search_analytics'>
export type SearchAnalyticsUpdate = Updates<'search_analytics'>

export type UsageMetric = Tables<'usage_metrics'>
export type UsageMetricInsert = Inserts<'usage_metrics'>
export type UsageMetricUpdate = Updates<'usage_metrics'>

export type EmbeddingAnalytics = Tables<'embedding_analytics'>
export type EmbeddingAnalyticsInsert = Inserts<'embedding_analytics'>
export type EmbeddingAnalyticsUpdate = Updates<'embedding_analytics'>

export type DailyUsageStats = Tables<'daily_usage_stats'>
export type DailyUsageStatsInsert = Inserts<'daily_usage_stats'>
export type DailyUsageStatsUpdate = Updates<'daily_usage_stats'>

export type CMSIntegration = Tables<'cms_integrations'>
export type CMSIntegrationInsert = Inserts<'cms_integrations'>
export type CMSIntegrationUpdate = Updates<'cms_integrations'>

export type CMSConnection = Tables<'cms_connections'>
export type CMSConnectionInsert = Inserts<'cms_connections'>
export type CMSConnectionUpdate = Updates<'cms_connections'>

export type CMSWebhookEvent = Tables<'cms_webhook_events'>
export type CMSWebhookEventInsert = Inserts<'cms_webhook_events'>
export type CMSWebhookEventUpdate = Updates<'cms_webhook_events'>

export type Widget = Tables<'widgets'>
export type WidgetInsert = Inserts<'widgets'>
export type WidgetUpdate = Updates<'widgets'>

export type UserPreferences = Tables<'user_preferences'>
export type UserPreferencesInsert = Inserts<'user_preferences'>
export type UserPreferencesUpdate = Updates<'user_preferences'>

export type UserSession = Tables<'user_sessions'>
export type UserSessionInsert = Inserts<'user_sessions'>
export type UserSessionUpdate = Updates<'user_sessions'>

export type ContactMessage = Tables<'contact_messages'>
export type ContactMessageInsert = Inserts<'contact_messages'>
export type ContactMessageUpdate = Updates<'contact_messages'>

export type NewsletterSubscription = Tables<'newsletter_subscriptions'>
export type NewsletterSubscriptionInsert = Inserts<'newsletter_subscriptions'>
export type NewsletterSubscriptionUpdate = Updates<'newsletter_subscriptions'>

export type StripeCustomer = Tables<'stripe_customers'>
export type StripeCustomerInsert = Inserts<'stripe_customers'>
export type StripeCustomerUpdate = Updates<'stripe_customers'>

export type UserProduct = Tables<'user_products'>
export type UserProductInsert = Inserts<'user_products'>
export type UserProductUpdate = Updates<'user_products'>

export type CMSSyncLog = Tables<'cms_sync_logs'>
export type CMSSyncLogInsert = Inserts<'cms_sync_logs'>
export type CMSSyncLogUpdate = Updates<'cms_sync_logs'>

// View types
export type EmbeddingStatistics = Tables<'embedding_statistics'>
export type TenantUsageDashboard = Tables<'tenant_usage_dashboard'>
export type CMSConnectionStats = Tables<'cms_connection_stats'>

// Enum types
export type StripePaymentMode = Enums<'stripe_payment_mode'>

// Export the Database type for use in createClient
export type { Database }
