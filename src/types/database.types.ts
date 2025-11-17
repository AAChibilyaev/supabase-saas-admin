export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_plans: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          max_documents: number
          max_search_queries_per_month: number
          max_storage_mb: number
          max_users_per_tenant: number
          monthly_price: number | null
          name: string
          slug: string
          sort_order: number
          stripe_price_id: string | null
          supports_advanced_search: boolean
          supports_api_access: boolean
          supports_custom_branding: boolean
          supports_file_upload: boolean
          updated_at: string | null
          yearly_price: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          max_documents?: number
          max_search_queries_per_month?: number
          max_storage_mb?: number
          max_users_per_tenant?: number
          monthly_price?: number | null
          name: string
          slug: string
          sort_order?: number
          stripe_price_id?: string | null
          supports_advanced_search?: boolean
          supports_api_access?: boolean
          supports_custom_branding?: boolean
          supports_file_upload?: boolean
          updated_at?: string | null
          yearly_price?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          max_documents?: number
          max_search_queries_per_month?: number
          max_storage_mb?: number
          max_users_per_tenant?: number
          monthly_price?: number | null
          name?: string
          slug?: string
          sort_order?: number
          stripe_price_id?: string | null
          supports_advanced_search?: boolean
          supports_api_access?: boolean
          supports_custom_branding?: boolean
          supports_file_upload?: boolean
          updated_at?: string | null
          yearly_price?: number | null
        }
        Relationships: []
      }
      cms_connections: {
        Row: {
          config: Json
          created_at: string | null
          field_mappings: Json | null
          filters: Json | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          last_sync_count: number | null
          last_sync_error: string | null
          last_sync_status: string | null
          name: string
          next_sync_at: string | null
          sync_mode: string | null
          sync_schedule: Json | null
          tenant_id: string
          type: string
          typesense_collection: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string | null
          field_mappings?: Json | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_count?: number | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          name: string
          next_sync_at?: string | null
          sync_mode?: string | null
          sync_schedule?: Json | null
          tenant_id: string
          type: string
          typesense_collection: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          field_mappings?: Json | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_count?: number | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          name?: string
          next_sync_at?: string | null
          sync_mode?: string | null
          sync_schedule?: Json | null
          tenant_id?: string
          type?: string
          typesense_collection?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "cms_connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "cms_connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_integrations: {
        Row: {
          cms_api_key: string
          cms_type: string
          cms_url: string
          collection: string
          created_at: string | null
          cron_expression: string | null
          field_mappings: Json | null
          id: string
          last_sync_at: string | null
          last_sync_count: number | null
          last_sync_error: string | null
          last_sync_status: string | null
          status: string
          sync_interval: number | null
          sync_type: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cms_api_key: string
          cms_type: string
          cms_url: string
          collection: string
          created_at?: string | null
          cron_expression?: string | null
          field_mappings?: Json | null
          id?: string
          last_sync_at?: string | null
          last_sync_count?: number | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          status?: string
          sync_interval?: number | null
          sync_type?: string
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cms_api_key?: string
          cms_type?: string
          cms_url?: string
          collection?: string
          created_at?: string | null
          cron_expression?: string | null
          field_mappings?: Json | null
          id?: string
          last_sync_at?: string | null
          last_sync_count?: number | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          status?: string
          sync_interval?: number | null
          sync_type?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "cms_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "cms_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          documents_failed: number | null
          documents_fetched: number | null
          documents_synced: number | null
          error_details: Json | null
          error_message: string | null
          id: string
          integration_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          documents_failed?: number | null
          documents_fetched?: number | null
          documents_synced?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          integration_id: string
          started_at?: string | null
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          documents_failed?: number | null
          documents_fetched?: number | null
          documents_synced?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          integration_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_sync_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "cms_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_webhook_events: {
        Row: {
          connection_id: string
          error: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
          received_at: string | null
          resource_id: string
          resource_type: string
          tenant_id: string
        }
        Insert: {
          connection_id: string
          error?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          received_at?: string | null
          resource_id: string
          resource_type: string
          tenant_id: string
        }
        Update: {
          connection_id?: string
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          received_at?: string | null
          resource_id?: string
          resource_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_webhook_events_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "cms_connection_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_webhook_events_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "cms_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_webhook_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "cms_webhook_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "cms_webhook_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          body: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_usage_stats: {
        Row: {
          api_calls_count: number | null
          created_at: string | null
          date: string
          document_count: number | null
          id: string
          search_count: number | null
          storage_used_mb: number | null
          tenant_id: string
          unique_users_count: number | null
          updated_at: string | null
        }
        Insert: {
          api_calls_count?: number | null
          created_at?: string | null
          date: string
          document_count?: number | null
          id?: string
          search_count?: number | null
          storage_used_mb?: number | null
          tenant_id: string
          unique_users_count?: number | null
          updated_at?: string | null
        }
        Update: {
          api_calls_count?: number | null
          created_at?: string | null
          date?: string
          document_count?: number | null
          id?: string
          search_count?: number | null
          storage_used_mb?: number | null
          tenant_id?: string
          unique_users_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_usage_stats_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "daily_usage_stats_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "daily_usage_stats_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          embedding: string | null
          embedding_dimensions: number | null
          embedding_generated: boolean | null
          embedding_hash: string | null
          embedding_model: string | null
          embedding_updated_at: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          tenant_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          embedding?: string | null
          embedding_dimensions?: number | null
          embedding_generated?: boolean | null
          embedding_hash?: string | null
          embedding_model?: string | null
          embedding_updated_at?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          tenant_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          embedding?: string | null
          embedding_dimensions?: number | null
          embedding_generated?: boolean | null
          embedding_hash?: string | null
          embedding_model?: string | null
          embedding_updated_at?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          id: string
          name: string
          type: string
          subject: string
          html_template: string
          variables: string[] | null
          is_active: boolean
          version: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          subject: string
          html_template: string
          variables?: string[] | null
          is_active?: boolean
          version?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          subject?: string
          html_template?: string
          variables?: string[] | null
          is_active?: boolean
          version?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      embedding_analytics: {
        Row: {
          created_at: string | null
          document_id: string | null
          embedding_dimensions: number
          embedding_model: string
          error_message: string | null
          id: string
          processing_time_ms: number | null
          success: boolean | null
          tenant_id: string | null
          token_count: number | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          embedding_dimensions: number
          embedding_model: string
          error_message?: string | null
          id?: string
          processing_time_ms?: number | null
          success?: boolean | null
          tenant_id?: string | null
          token_count?: number | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          embedding_dimensions?: number
          embedding_model?: string
          error_message?: string | null
          id?: string
          processing_time_ms?: number | null
          success?: boolean | null
          tenant_id?: string | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "embedding_analytics_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embedding_analytics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "embedding_analytics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "embedding_analytics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscriptions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          source: string | null
          subscribed_at: string | null
          unsubscribed_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
          created_at: string | null
          filters: Json | null
          id: string
          query: string
          response_time_ms: number | null
          results_count: number | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          query: string
          response_time_ms?: number | null
          results_count?: number | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          query?: string
          response_time_ms?: number | null
          results_count?: number | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_analytics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "search_analytics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "search_analytics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      search_logs: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          query: string
          response_time_ms: number | null
          results_count: number | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          query: string
          response_time_ms?: number | null
          results_count?: number | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          query?: string
          response_time_ms?: number | null
          results_count?: number | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "search_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "search_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      search_queries_log: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          processing_time_ms: number | null
          query_filters: Json | null
          query_sort_by: string | null
          query_text: string
          results_count: number | null
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          processing_time_ms?: number | null
          query_filters?: Json | null
          query_sort_by?: string | null
          query_text: string
          results_count?: number | null
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          processing_time_ms?: number | null
          query_filters?: Json | null
          query_sort_by?: string | null
          query_text?: string
          results_count?: number | null
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_queries_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "search_queries_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "search_queries_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          stripe_customer_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sync_errors: {
        Row: {
          created_at: string | null
          document_id: string | null
          error_details: Json | null
          error_message: string
          id: string
          last_attempt_at: string | null
          operation_type: string
          resolved_at: string | null
          retry_count: number | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          error_details?: Json | null
          error_message: string
          id?: string
          last_attempt_at?: string | null
          operation_type: string
          resolved_at?: string | null
          retry_count?: number | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          error_details?: Json | null
          error_message?: string
          id?: string
          last_attempt_at?: string | null
          operation_type?: string
          resolved_at?: string | null
          retry_count?: number | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_errors_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_errors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "sync_errors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "sync_errors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          metadata: Json | null
          role: string
          status: string
          tenant_id: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          metadata?: Json | null
          role: string
          status?: string
          tenant_id: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          metadata?: Json | null
          role?: string
          status?: string
          tenant_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "team_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "team_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_api_keys: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          metadata: Json | null
          name: string
          revoked_at: string | null
          revoked_by: string | null
          scopes: string[]
          tenant_id: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          metadata?: Json | null
          name: string
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: string[]
          tenant_id: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          metadata?: Json | null
          name?: string
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: string[]
          tenant_id?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenant_api_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_api_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_api_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_billing: {
        Row: {
          billing_plan_id: string
          created_at: string | null
          id: string
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          billing_plan_id: string
          created_at?: string | null
          id?: string
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          billing_plan_id?: string
          created_at?: string | null
          id?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_billing_billing_plan_id_fkey"
            columns: ["billing_plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_billing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_billing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_billing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_usage: {
        Row: {
          active_users_count: number
          billing_month: string
          created_at: string | null
          document_count: number
          id: string
          plan_max_documents: number
          plan_max_search_queries: number
          plan_max_storage_mb: number
          plan_max_users: number
          search_queries_count: number
          tenant_id: string
          total_storage_bytes: number
          updated_at: string | null
        }
        Insert: {
          active_users_count?: number
          billing_month?: string
          created_at?: string | null
          document_count?: number
          id?: string
          plan_max_documents?: number
          plan_max_search_queries?: number
          plan_max_storage_mb?: number
          plan_max_users?: number
          search_queries_count?: number
          tenant_id: string
          total_storage_bytes?: number
          updated_at?: string | null
        }
        Update: {
          active_users_count?: number
          billing_month?: string
          created_at?: string | null
          document_count?: number
          id?: string
          plan_max_documents?: number
          plan_max_search_queries?: number
          plan_max_storage_mb?: number
          plan_max_users?: number
          search_queries_count?: number
          tenant_id?: string
          total_storage_bytes?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          billing_cycle_end: string | null
          billing_cycle_start: string | null
          branding_logo_url: string | null
          branding_primary_color: string | null
          created_at: string | null
          custom_domain: string | null
          default_language: string | null
          id: string
          name: string
          plan_type: string
          slug: string
          stripe_subscription_id: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle_end?: string | null
          billing_cycle_start?: string | null
          branding_logo_url?: string | null
          branding_primary_color?: string | null
          created_at?: string | null
          custom_domain?: string | null
          default_language?: string | null
          id?: string
          name: string
          plan_type?: string
          slug: string
          stripe_subscription_id?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle_end?: string | null
          billing_cycle_start?: string | null
          branding_logo_url?: string | null
          branding_primary_color?: string | null
          created_at?: string | null
          custom_domain?: string | null
          default_language?: string | null
          id?: string
          name?: string
          plan_type?: string
          slug?: string
          stripe_subscription_id?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tenants_billing_plan"
            columns: ["plan_type"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["name"]
          },
        ]
      }
      usage_metrics: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "usage_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "usage_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          email_notifications: Json
          id: string
          notification_frequency: string
          push_notifications: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: Json
          id?: string
          notification_frequency?: string
          push_notifications?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: Json
          id?: string
          notification_frequency?: string
          push_notifications?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_products: {
        Row: {
          created_at: string
          id: number
          is_active: boolean | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_product_id: string
          tenant_id: string | null
          type: Database["public"]["Enums"]["stripe_payment_mode"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id: string
          tenant_id?: string | null
          type: Database["public"]["Enums"]["stripe_payment_mode"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["stripe_payment_mode"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "user_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "user_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          expires_at: string
          id: string
          ip_address: unknown
          is_current: boolean | null
          last_activity: string
          location: string | null
          metadata: Json | null
          os: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_current?: boolean | null
          last_activity?: string
          location?: string | null
          metadata?: Json | null
          os?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_current?: boolean | null
          last_activity?: string
          location?: string | null
          metadata?: Json | null
          os?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_tenants: {
        Row: {
          created_at: string | null
          id: string
          role: string
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      widgets: {
        Row: {
          configuration: Json
          created_at: string
          created_by: string
          description: string | null
          embed_code: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          name: string
          tenant_id: string
          type: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          configuration?: Json
          created_at?: string
          created_by: string
          description?: string | null
          embed_code?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name: string
          tenant_id: string
          type: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          configuration?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          embed_code?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name?: string
          tenant_id?: string
          type?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "widgets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "widgets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "widgets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cms_connection_stats: {
        Row: {
          avg_sync_duration_ms: number | null
          failed_syncs: number | null
          id: string | null
          is_active: boolean | null
          last_sync_at: string | null
          last_sync_status: string | null
          name: string | null
          next_sync_at: string | null
          successful_syncs: number | null
          tenant_id: string | null
          total_documents_processed: number | null
          total_syncs: number | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "embedding_statistics"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "cms_connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_usage_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "cms_connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      embedding_statistics: {
        Row: {
          documents_with_embeddings: number | null
          documents_without_embeddings: number | null
          embedding_coverage_percent: number | null
          last_embedding_update: string | null
          tenant_id: string | null
          tenant_name: string | null
          total_documents: number | null
        }
        Relationships: []
      }
      tenant_usage_dashboard: {
        Row: {
          active_users_count: number | null
          billing_month: string | null
          document_count: number | null
          document_limit: number | null
          limit_status: string | null
          plan_display_name: string | null
          plan_type: string | null
          search_queries_count: number | null
          search_queries_limit: number | null
          storage_limit_mb: number | null
          storage_used_mb: number | null
          tenant_id: string | null
          tenant_name: string | null
          tenant_slug: string | null
          users_limit: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tenants_billing_plan"
            columns: ["plan_type"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["name"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      stripe_payment_mode: "payment" | "subscription"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      stripe_payment_mode: ["payment", "subscription"],
    },
  },
} as const
