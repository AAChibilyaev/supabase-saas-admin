# CMS Integrations

This directory contains the complete CMS integration management system for syncing content from popular CMS platforms.

## Features

### Supported CMS Platforms
- WordPress (REST API v2)
- Contentful (Content Delivery API)
- Strapi (Headless CMS)
- Ghost (Content API)
- Custom API (Generic REST connector)
- Extensible to support: Sanity, Payload, Directus

### Core Functionality

#### 1. Connection Management
- Add/Edit/Delete CMS connections
- Test connection before saving
- Configure API credentials securely
- Toggle active/inactive state

#### 2. Field Mapping
- Visual field mapper interface
- Map CMS fields to document fields
- Apply transformations (lowercase, uppercase, strip HTML, etc.)
- Required field validation

#### 3. Sync Configuration
- **Manual Sync**: Trigger on-demand
- **Scheduled Sync**:
  - Fixed intervals (15min, 30min, 1hr, 6hr, 12hr, daily)
  - Custom cron expressions
- **Webhook Sync**: Real-time updates
- **Incremental Sync**: Only sync changed content

#### 4. Sync Monitoring
- View sync history with detailed logs
- Track success/failure rates
- Monitor document counts (fetched, synced, failed)
- Error details and retry capability

#### 5. Webhook Management
- Auto-setup webhooks (where supported)
- Copy webhook URLs
- Configure webhook events
- Signature validation

## Directory Structure

```
cms-integrations/
├── components/
│   ├── ConnectionTest.tsx      # Test CMS connection
│   ├── FieldMapper.tsx          # Visual field mapping
│   ├── SyncScheduler.tsx        # Configure sync schedule
│   ├── SyncHistory.tsx          # View sync logs
│   └── WebhookSetup.tsx         # Webhook configuration
├── connectors/
│   ├── WordPressConnector.ts    # WordPress implementation
│   ├── ContentfulConnector.ts   # Contentful implementation
│   ├── StrapiConnector.ts       # Strapi implementation
│   ├── GhostConnector.ts        # Ghost implementation
│   ├── CustomConnector.ts       # Generic REST API
│   └── index.ts                 # Connector registry
├── IntegrationList.tsx          # List all connections
├── IntegrationCreate.tsx        # Create new connection
├── IntegrationEdit.tsx          # Edit existing connection
├── index.ts                     # Module exports
└── README.md                    # This file
```

## Usage

### Creating a New Integration

1. Navigate to "CMS Integrations" in the admin panel
2. Click "Create"
3. Fill in the connection details:
   - Name: Friendly name for the connection
   - CMS Type: Select from supported platforms
   - URL: Your CMS base URL
   - API Key: Authentication credentials
4. Test the connection
5. Configure field mappings
6. Set up sync schedule
7. (Optional) Configure webhooks for real-time sync

### Field Mapping

Map fields from your CMS to document fields:

```
Source Field (CMS)    →    Target Field (Document)
─────────────────────────────────────────────────
title.rendered        →    title
content.rendered      →    content
date                  →    created_at
```

Apply transformations as needed:
- `lowercase`: Convert to lowercase
- `uppercase`: Convert to uppercase
- `strip_html`: Remove HTML tags
- `trim`: Remove whitespace

### Sync Modes

**Manual**
- Trigger syncs on-demand
- Best for testing and one-time imports

**Scheduled**
- Fixed intervals or cron expressions
- Automatic background syncing
- Good for regular content updates

**Webhook**
- Real-time syncing on content changes
- Requires webhook support in CMS
- Most efficient for frequently updated content

**Incremental**
- Only sync changed content since last sync
- Reduces API calls and processing time
- Recommended for large content libraries

## Connector Interface

Each connector implements the `CMSConnector` interface:

```typescript
interface CMSConnector {
  type: CMSType
  name: string

  // Test connection to CMS
  testConnection(config: CMSConfig): Promise<{ success: boolean; message?: string }>

  // Fetch documents from CMS
  fetchDocuments(config: CMSConfig, options: FetchOptions): Promise<any[]>

  // Get available fields from CMS
  getAvailableFields(config: CMSConfig): Promise<Field[]>

  // Map source data to target format
  mapFields(sourceData: any, mappings: FieldMapping[]): any

  // Optional: Setup webhooks
  setupWebhook?(config: CMSConfig, webhookUrl: string): Promise<WebhookConfig>

  // Optional: Validate webhook signatures
  validateWebhookSignature?(payload: any, signature: string, secret: string): boolean
}
```

## Adding a New Connector

To add support for a new CMS:

1. Create a new file in `connectors/` (e.g., `SanityConnector.ts`)
2. Implement the `CMSConnector` interface
3. Add to the connector registry in `connectors/index.ts`
4. Add CMS type to `CMS_TYPES` in `src/types/cms.ts`

Example:

```typescript
import type { CMSConnector, CMSConfig, Field, FieldMapping, FetchOptions } from '../../../types/cms'

export class SanityConnector implements CMSConnector {
  type = 'sanity' as const
  name = 'Sanity'

  async testConnection(config: CMSConfig): Promise<{ success: boolean; message?: string }> {
    // Implementation
  }

  async fetchDocuments(config: CMSConfig, options: FetchOptions): Promise<any[]> {
    // Implementation
  }

  async getAvailableFields(config: CMSConfig): Promise<Field[]> {
    // Implementation
  }

  mapFields(sourceData: any, mappings: FieldMapping[]): any {
    // Implementation
  }
}
```

## Database Schema

The feature uses these tables:

- `cms_connections`: Store connection configurations
- `cms_integrations`: Legacy table (kept for compatibility)
- `cms_sync_logs`: Track sync history and statistics
- `cms_webhook_events`: Store webhook events for processing

## API Requirements

### WordPress
- REST API v2 (built-in since WordPress 4.7)
- Optional: Bearer token authentication
- Optional: WP Webhooks plugin for webhook support

### Contentful
- Content Delivery API access token
- Space ID and environment name
- Management API token for webhook setup

### Strapi
- API token with read permissions
- Content Type API access
- Webhook support built-in (v4+)

### Ghost
- Content API Key
- Admin API Key for webhook setup
- Ghost v3+ recommended

### Custom API
- REST API endpoint
- Authentication method (Bearer token, API key, etc.)
- JSON response format

## Security Considerations

- API keys are stored encrypted in the database
- Webhook signatures should be validated
- Use HTTPS for all CMS connections
- Implement rate limiting for sync operations
- Validate and sanitize all CMS data before syncing

## Troubleshooting

### Connection Test Fails
- Verify CMS URL is correct and accessible
- Check API credentials are valid
- Ensure CMS allows API access from your domain
- Check firewall rules and CORS settings

### Sync Not Running
- Verify connection is active
- Check sync schedule configuration
- Review error logs in sync history
- Ensure target Typesense collection exists

### Missing Fields
- Verify field mappings are configured
- Check CMS content has required fields
- Review field transformation rules
- Check for API permission issues

### Webhook Not Working
- Verify webhook URL is accessible from CMS
- Check webhook secret matches
- Review webhook event configuration
- Check CMS webhook delivery logs

## Future Enhancements

- [ ] Selective field syncing (exclude certain fields)
- [ ] Custom transformation functions
- [ ] Sync filters (only sync published content, specific categories, etc.)
- [ ] Batch processing for large content libraries
- [ ] Conflict resolution strategies
- [ ] Multi-directional sync (bidirectional)
- [ ] Content preview before sync
- [ ] Dry-run mode
- [ ] Advanced error recovery
- [ ] Sync analytics dashboard
