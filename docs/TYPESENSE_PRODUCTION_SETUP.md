# Typesense Production Setup Guide

This guide covers setting up Typesense for production use in the SaaS Search Platform.

## Overview

Typesense is the search engine powering the platform. This guide covers:
- Production server setup
- API key management
- Auto-sync configuration
- Health monitoring
- Performance optimization

---

## Production Server Setup

### Option 1: Self-Hosted Typesense

#### Requirements

- Server with at least 4GB RAM
- Docker installed
- Domain name (optional, for SSL)

#### Installation

```bash
# Pull Typesense image
docker pull typesense/typesense:0.25.2

# Run Typesense container
docker run -d \
  --name typesense \
  -p 8108:8108 \
  -v /tmp/typesense-data:/data \
  typesense/typesense:0.25.2 \
  --data-dir /data \
  --api-key=your-admin-api-key \
  --enable-cors
```

#### With SSL (Production)

```bash
docker run -d \
  --name typesense \
  -p 443:8108 \
  -v /tmp/typesense-data:/data \
  -v /path/to/ssl:/ssl \
  typesense/typesense:0.25.2 \
  --data-dir /data \
  --api-key=your-admin-api-key \
  --ssl-certificate=/ssl/cert.pem \
  --ssl-certificate-key=/ssl/key.pem \
  --enable-cors
```

### Option 2: Typesense Cloud

1. Sign up at [Typesense Cloud](https://cloud.typesense.org)
2. Create a cluster
3. Get connection details from dashboard
4. Use provided API keys

---

## API Key Management

### Admin API Key

**Purpose**: Full access to Typesense (server-side only)

**Permissions**: All operations (create collections, index documents, search, etc.)

**Security**: 
- Never expose to frontend
- Store in Supabase Edge Functions secrets
- Rotate regularly

**Creation**:

```bash
# Via Typesense API (if not set during installation)
curl "http://localhost:8108/operations/keys" \
  -X POST \
  -H "X-TYPESENSE-API-KEY: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Admin key for server operations",
    "actions": ["*"],
    "collections": ["*"]
  }'
```

### Search-Only API Key

**Purpose**: Limited access for frontend searches

**Permissions**: Search only, no write access

**Creation**:

```bash
curl "http://localhost:8108/operations/keys" \
  -X POST \
  -H "X-TYPESENSE-API-KEY: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Search-only key for frontend",
    "actions": ["documents:search"],
    "collections": ["*"]
  }'
```

**Usage in Frontend**:

```typescript
// Store in environment variable
VITE_TYPESENSE_SEARCH_KEY=search-only-key

// Use in Typesense client
const client = new Typesense.Client({
  nodes: [{
    host: 'your-typesense-server.com',
    port: 443,
    protocol: 'https'
  }],
  apiKey: import.meta.env.VITE_TYPESENSE_SEARCH_KEY,
  connectionTimeoutSeconds: 2
})
```

---

## Auto-Sync Configuration

### Database Triggers

The project includes auto-sync triggers in `supabase/migrations/20251117_typesense_auto_sync.sql`.

**Verify Triggers**:

```sql
-- Check if triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%typesense%';
```

**Expected Triggers**:
- `sync_document_to_typesense_on_insert`
- `sync_document_to_typesense_on_update`
- `sync_document_to_typesense_on_delete`

### Sync Function

The sync function calls the `sync-to-typesense` Edge Function:

```sql
-- Verify function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'sync_document_to_typesense';
```

### Testing Auto-Sync

1. **Create a document**:
   ```sql
   INSERT INTO documents (tenant_id, title, content)
   VALUES ('tenant-id', 'Test', 'Content');
   ```

2. **Check sync log**:
   ```sql
   SELECT * FROM sync_errors
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **Verify in Typesense**:
   ```bash
   curl "http://localhost:8108/collections/documents/documents/search?q=test" \
     -H "X-TYPESENSE-API-KEY: your-admin-key"
   ```

---

## Batch Sync for Existing Data

### Initial Data Sync

If you have existing documents, sync them in batches:

```typescript
// Use batch-sync-to-typesense Edge Function
const batchSize = 100
const documents = await getDocumentsBatch(offset, batchSize)

await fetch(`${SUPABASE_URL}/functions/v1/batch-sync-to-typesense`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ documents }),
})
```

### Migration Script

Create a migration script for initial sync:

```sql
-- supabase/migrations/YYYYMMDD_initial_typesense_sync.sql

-- Create a function to sync all existing documents
CREATE OR REPLACE FUNCTION sync_all_documents_to_typesense()
RETURNS void AS $$
DECLARE
  doc RECORD;
  batch_size INTEGER := 100;
  current_batch INTEGER := 0;
BEGIN
  FOR doc IN SELECT * FROM documents ORDER BY created_at
  LOOP
    -- Call sync function for each document
    PERFORM sync_document_to_typesense(doc.id);
    
    current_batch := current_batch + 1;
    
    -- Commit in batches
    IF current_batch >= batch_size THEN
      COMMIT;
      current_batch := 0;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## Health Monitoring

### Health Check Endpoint

Typesense provides a health endpoint:

```bash
curl "http://localhost:8108/health"
```

**Expected Response**:
```json
{"ok": true}
```

### Integration with Application

The project includes `src/utils/typesenseHealth.ts` for health checks:

```typescript
import { checkTypesenseHealth } from '@/utils/typesenseHealth'

const health = await checkTypesenseHealth()
if (!health.healthy) {
  // Alert or handle error
}
```

### Dashboard Widget

The `TypesenseHealthWidget` component displays health status:

```tsx
import { TypesenseHealthWidget } from '@/components/dashboard/TypesenseHealthWidget'

<TypesenseHealthWidget />
```

### Alerts

Set up alerts for:
- Health check failures
- High error rates
- Slow response times
- Disk space usage

---

## Performance Optimization

### Collection Configuration

Optimize collections for your use case:

```typescript
const collectionSchema = {
  name: 'documents',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'content', type: 'string' },
    { name: 'tenant_id', type: 'string', facet: true },
    { name: 'created_at', type: 'int64', sort: true },
  ],
  default_sorting_field: 'created_at',
}
```

### Indexing Strategy

1. **Batch Indexing**: Use batch operations for multiple documents
2. **Async Indexing**: Don't block on indexing operations
3. **Incremental Updates**: Only sync changed documents

### Query Optimization

1. **Use Facets**: For filtering and grouping
2. **Limit Results**: Use `per_page` parameter
3. **Cache Results**: Cache frequent queries
4. **Optimize Search Fields**: Only search relevant fields

---

## Replication (Optional)

For high availability, set up replication:

```bash
# Primary node
docker run -d \
  --name typesense-primary \
  typesense/typesense:0.25.2 \
  --data-dir /data \
  --api-key=admin-key

# Replica node
docker run -d \
  --name typesense-replica \
  typesense/typesense:0.25.2 \
  --data-dir /data \
  --api-key=admin-key \
  --master=http://primary:8108
```

---

## Backup & Recovery

### Backup Data Directory

```bash
# Stop Typesense
docker stop typesense

# Backup data directory
tar -czf typesense-backup-$(date +%Y%m%d).tar.gz /tmp/typesense-data

# Start Typesense
docker start typesense
```

### Restore from Backup

```bash
# Stop Typesense
docker stop typesense

# Restore data directory
tar -xzf typesense-backup-YYYYMMDD.tar.gz -C /tmp/

# Start Typesense
docker start typesense
```

---

## Security Best Practices

1. **Use HTTPS**: Always use HTTPS in production
2. **Rotate API Keys**: Regularly rotate admin keys
3. **Limit Access**: Use search-only keys for frontend
4. **Network Security**: Restrict access to Typesense server
5. **Monitor Access**: Log all API key usage

---

## Troubleshooting

### Sync Not Working

1. Check Edge Function logs
2. Verify database triggers are active
3. Check `sync_errors` table
4. Verify Typesense connection
5. Check API keys are correct

### Slow Performance

1. Check server resources (CPU, RAM, disk)
2. Optimize collection schemas
3. Review query patterns
4. Consider adding more replicas
5. Check network latency

### High Error Rate

1. Check Typesense logs
2. Review sync error patterns
3. Verify data format matches schema
4. Check for rate limiting
5. Review API key permissions

---

## Production Checklist

- [ ] Typesense server deployed and accessible
- [ ] Admin API key created and secured
- [ ] Search-only API key created for frontend
- [ ] Auto-sync triggers verified
- [ ] Initial data sync completed
- [ ] Health monitoring configured
- [ ] Alerts set up
- [ ] Backup strategy in place
- [ ] SSL/HTTPS configured
- [ ] Performance tested
- [ ] Documentation updated

---

## Additional Resources

- [Typesense Documentation](https://typesense.org/docs)
- [Typesense Cloud](https://cloud.typesense.org)
- [Typesense GitHub](https://github.com/typesense/typesense)

---

**Last Updated:** 2025-01-17
**Status:** Ready for production setup

