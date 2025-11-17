# Typesense Troubleshooting Guide

Comprehensive guide for diagnosing and fixing common Typesense integration issues.

## Table of Contents

1. [Connection Issues](#connection-issues)
2. [Configuration Problems](#configuration-problems)
3. [Search Issues](#search-issues)
4. [Sync Problems](#sync-problems)
5. [Performance Issues](#performance-issues)
6. [Data Import Issues](#data-import-issues)
7. [API Key Issues](#api-key-issues)
8. [Collection Schema Issues](#collection-schema-issues)
9. [Monitoring and Diagnostics](#monitoring-and-diagnostics)
10. [Common Error Messages](#common-error-messages)

---

## Connection Issues

### Issue: "Typesense client is not initialized"

**Symptoms:**
- Dashboard widget shows "Typesense is not configured"
- API calls fail with client initialization errors
- Console shows warnings about missing environment variables

**Diagnosis:**
```bash
# Check if environment variables are set
echo $VITE_TYPESENSE_URL
echo $VITE_TYPESENSE_API_KEY

# In browser console:
console.log(import.meta.env.VITE_TYPESENSE_URL)
console.log(import.meta.env.VITE_TYPESENSE_API_KEY)
```

**Solutions:**

1. **Set environment variables in `.env`:**
```bash
VITE_TYPESENSE_URL=http://localhost:8108
VITE_TYPESENSE_API_KEY=your-api-key-here
```

2. **Restart development server:**
```bash
npm run dev
```

3. **Verify `.env` file location:**
- Must be in project root directory
- Must be named exactly `.env`
- Vite requires `VITE_` prefix for exposed variables

4. **Check file permissions:**
```bash
ls -la .env
# Should be readable
```

---

### Issue: "Connection timeout" or "Cannot connect to Typesense"

**Symptoms:**
- Health check fails
- Requests timeout after 10 seconds
- All nodes shown as unhealthy in dashboard

**Diagnosis:**
```bash
# Test connection directly
curl http://localhost:8108/health

# Check if Typesense is running
docker ps | grep typesense

# Check Typesense logs
docker logs <container-id>
```

**Solutions:**

1. **Verify Typesense server is running:**
```bash
# Start Typesense if not running
docker run -d \
  -p 8108:8108 \
  -v /tmp/typesense-data:/data \
  typesense/typesense:26.0 \
  --data-dir /data \
  --api-key=xyz \
  --enable-cors
```

2. **Check network connectivity:**
```bash
# Ping the server
ping localhost

# Test port accessibility
telnet localhost 8108
# or
nc -zv localhost 8108
```

3. **Verify firewall settings:**
```bash
# On Linux
sudo ufw status
sudo ufw allow 8108

# On macOS
# Check System Preferences > Security & Privacy > Firewall
```

4. **Check Docker networking (if using Docker):**
```bash
# Inspect Docker network
docker network inspect bridge

# Use host network mode if needed
docker run --network host typesense/typesense:26.0 ...
```

---

### Issue: "CORS policy blocking requests"

**Symptoms:**
- Browser console shows CORS errors
- Requests work with curl but fail in browser
- Error: "No 'Access-Control-Allow-Origin' header"

**Solutions:**

1. **Enable CORS in Typesense:**
```bash
# Add --enable-cors flag
docker run -p 8108:8108 \
  typesense/typesense:26.0 \
  --enable-cors \
  --api-key=xyz
```

2. **Check Typesense configuration file:**
```bash
# In typesense.ini or command line args
--enable-cors
```

3. **Use reverse proxy (production):**
```nginx
# nginx configuration
location /typesense/ {
    proxy_pass http://typesense:8108/;
    add_header Access-Control-Allow-Origin *;
}
```

---

## Configuration Problems

### Issue: "Invalid API key"

**Symptoms:**
- 401 Unauthorized errors
- Authentication failed messages
- Health check works but other requests fail

**Diagnosis:**
```typescript
// Test API key
import { typesenseClient } from './providers/typesenseClient'

try {
  const collections = await typesenseClient.collections().retrieve()
  console.log('API key is valid')
} catch (error) {
  console.error('API key error:', error.message)
}
```

**Solutions:**

1. **Verify API key matches server configuration:**
```bash
# Check what key Typesense is using
docker logs <container-id> | grep "api-key"
```

2. **Update environment variable:**
```bash
# Must match exactly
VITE_TYPESENSE_API_KEY=xyz
```

3. **Create search-only key for frontend:**
```typescript
// In admin panel or via API
await typesenseClient.keys().create({
  description: 'Search-only key',
  actions: ['documents:search'],
  collections: ['*']
})
```

---

### Issue: "Multiple nodes configuration not working"

**Symptoms:**
- Failover not working
- Only primary node being used
- Health checks fail for additional nodes

**Solutions:**

1. **Verify JSON format in environment variable:**
```bash
# Correct format
VITE_TYPESENSE_ADDITIONAL_NODES='[{"host":"node2.example.com","port":8108,"protocol":"https"}]'

# Must be valid JSON array
```

2. **Test each node individually:**
```bash
curl http://node1.example.com:8108/health
curl http://node2.example.com:8108/health
```

3. **Check node URLs are accessible:**
```typescript
import { typesenseClient } from './providers/typesenseClient'

// Client automatically tries nodes in order
// Check logs for which node is being used
```

---

## Search Issues

### Issue: "Search returns no results" (but documents exist)

**Symptoms:**
- Collection has documents
- Query seems correct
- Always returns 0 results

**Diagnosis:**
```typescript
// Test with wildcard search
const results = await typesenseClient
  .collections('your-collection')
  .documents()
  .search({
    q: '*',
    query_by: 'field1',
  })

console.log('Total documents:', results.found)

// Check document structure
const doc = await typesenseClient
  .collections('your-collection')
  .documents('some-id')
  .retrieve()

console.log('Document structure:', doc)
```

**Solutions:**

1. **Verify `query_by` fields exist:**
```typescript
// BAD: Field doesn't exist
q: 'laptop',
query_by: 'titel' // Typo!

// GOOD: Correct field name
q: 'laptop',
query_by: 'title'
```

2. **Check field types are searchable:**
```typescript
// Only string fields are searchable
// BAD:
{
  name: 'price',
  type: 'float' // Not searchable
}

// GOOD:
{
  name: 'description',
  type: 'string' // Searchable
}
```

3. **Reduce typo tolerance:**
```typescript
// Try with exact matching first
{
  q: 'laptop',
  query_by: 'title',
  num_typos: 0, // No typos
}
```

4. **Check for filters blocking results:**
```typescript
// Remove filters temporarily
{
  q: 'laptop',
  query_by: 'title',
  // filter_by: 'in_stock:true' // Comment out
}
```

---

### Issue: "Search is too slow"

**Symptoms:**
- Queries take > 100ms
- UI feels sluggish
- Timeout errors

**Diagnosis:**
```typescript
// Measure search time
const start = Date.now()
const results = await typesenseClient
  .collections('your-collection')
  .documents()
  .search({...})
const duration = Date.now() - start

console.log('Search took:', duration, 'ms')
console.log('Typesense search_time_ms:', results.search_time_ms)
```

**Solutions:**

1. **Limit query_by fields:**
```typescript
// BAD: Searching too many fields
query_by: 'title,description,content,tags,notes,metadata'

// GOOD: Only essential fields
query_by: 'title,description'
```

2. **Reduce per_page:**
```typescript
// BAD: Too many results
per_page: 1000

// GOOD: Paginate properly
per_page: 20
```

3. **Use field selection:**
```typescript
// Only fetch needed fields
{
  q: 'laptop',
  query_by: 'title',
  include_fields: 'id,title,price' // Only these fields
}
```

4. **Enable caching:**
```typescript
// Use SearchClient with caching
import { typesenseSearchClient } from './providers/typesenseClient'

// Automatically caches results for 5 minutes
```

5. **Optimize collection schema:**
```typescript
// Remove unused optional fields
// Add appropriate indexes
// Use smaller field types where possible
```

---

### Issue: "Relevance is poor" (wrong results ranked first)

**Solutions:**

1. **Add curations for common queries:**
```typescript
// Pin specific results for popular queries
await typesenseClient.collections('products').overrides().upsert('best-laptop', {
  rule: {
    query: 'best laptop',
    match: 'exact'
  },
  includes: [
    { id: 'product-123', position: 1 }
  ]
})
```

2. **Configure synonyms:**
```typescript
await typesenseClient.collections('products').synonyms().upsert('laptop-synonyms', {
  synonyms: ['laptop', 'notebook', 'portable computer']
})
```

3. **Adjust field weights:**
```typescript
// Boost title matches over description
{
  query_by: 'title,description',
  query_by_weights: '3,1' // Title 3x more important
}
```

4. **Use multi-match strategy:**
```typescript
{
  query_by: 'title,description',
  drop_tokens_threshold: 0, // Don't drop query tokens
  typo_tokens_threshold: 0, // Require all tokens to match
}
```

---

## Sync Problems

### Issue: "Auto-sync not working"

**Symptoms:**
- Database changes not appearing in Typesense
- Trigger exists but doesn't fire
- Sync logs show failures

**Diagnosis:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger
WHERE tgname LIKE '%typesense%';

-- Check sync logs
SELECT * FROM typesense_sync_log
ORDER BY synced_at DESC
LIMIT 20;

-- Test function manually
SELECT sync_to_typesense();
```

**Solutions:**

1. **Verify trigger is enabled:**
```sql
-- Re-create trigger
DROP TRIGGER IF EXISTS trigger_sync_documents_to_typesense ON documents;

CREATE TRIGGER trigger_sync_documents_to_typesense
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION sync_to_typesense();
```

2. **Check Edge Function is deployed:**
```bash
# Deploy function
supabase functions deploy sync-to-typesense

# Check function exists
supabase functions list
```

3. **Verify environment secrets:**
```bash
# Set secrets
supabase secrets set TYPESENSE_HOST=localhost
supabase secrets set TYPESENSE_PORT=8108
supabase secrets set TYPESENSE_API_KEY=xyz

# List secrets
supabase secrets list
```

4. **Check function logs:**
```bash
# View Edge Function logs
supabase functions log sync-to-typesense

# Look for errors
```

5. **Test manual sync:**
```sql
-- Trigger sync for one record
SELECT batch_sync_to_typesense('documents', 1, 0);
```

---

### Issue: "Batch sync fails or times out"

**Symptoms:**
- Large imports fail
- Timeout errors during sync
- Partial sync completed

**Solutions:**

1. **Reduce batch size:**
```typescript
// In batch-sync-to-typesense function
.import(documents, {
  action: 'upsert',
  batch_size: 50 // Reduce from 100
})
```

2. **Sync in smaller chunks:**
```sql
-- Sync 100 at a time
SELECT batch_sync_to_typesense('documents', 100, 0);
SELECT batch_sync_to_typesense('documents', 100, 100);
SELECT batch_sync_to_typesense('documents', 100, 200);
```

3. **Increase function timeout:**
```bash
# In supabase/config.toml
[functions.batch-sync-to-typesense]
timeout = 300 # 5 minutes
```

4. **Use background jobs:**
```sql
-- Create pg_cron job for large syncs
SELECT cron.schedule(
  'sync-documents-to-typesense',
  '0 2 * * *', -- Every day at 2 AM
  $$SELECT batch_sync_to_typesense('documents', 1000, 0)$$
);
```

---

## Performance Issues

### Issue: "High memory usage"

**Diagnosis:**
```bash
# Check Typesense metrics
curl http://localhost:8108/metrics.json

# Check Docker stats
docker stats <container-id>
```

**Solutions:**

1. **Optimize collection schemas:**
```typescript
// Remove unused fields
// Use appropriate field types
// Don't index everything
```

2. **Increase Typesense memory:**
```bash
# Docker with memory limit
docker run -m 2g typesense/typesense:26.0 ...
```

3. **Clean up old collections:**
```typescript
// Delete unused collections
await typesenseClient.collections('old-collection').delete()
```

---

### Issue: "Slow indexing"

**Solutions:**

1. **Use bulk import:**
```typescript
// BAD: Individual creates
for (const doc of documents) {
  await typesenseClient.collections('test').documents().create(doc)
}

// GOOD: Bulk import
await typesenseClient.collections('test').documents().import(documents, {
  action: 'create',
  batch_size: 100
})
```

2. **Increase batch size:**
```typescript
// For large datasets
.import(documents, {
  action: 'upsert',
  batch_size: 500 // Increase from 100
})
```

---

## Data Import Issues

### Issue: "Import fails with schema errors"

**Symptoms:**
- "Field not found" errors
- "Type mismatch" errors
- Partial import success

**Solutions:**

1. **Validate data before import:**
```typescript
// Check all required fields exist
const validateDocument = (doc: any, schema: any) => {
  const requiredFields = schema.fields
    .filter((f: any) => !f.optional)
    .map((f: any) => f.name)

  const missing = requiredFields.filter((field: string) => !(field in doc))

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`)
  }

  return true
}

documents.forEach(doc => validateDocument(doc, collectionSchema))
```

2. **Transform data to match schema:**
```typescript
const transformForTypesense = (record: any) => ({
  id: String(record.id), // Ensure string
  title: record.title || '',
  price: parseFloat(record.price) || 0,
  created_at: Math.floor(new Date(record.created_at).getTime() / 1000), // Unix timestamp
})

const transformed = documents.map(transformForTypesense)
```

3. **Handle import errors:**
```typescript
const results = await typesenseClient
  .collections('products')
  .documents()
  .import(documents, { action: 'upsert' })

// Parse results
const parsed = results
  .split('\n')
  .filter(line => line.trim())
  .map(line => JSON.parse(line))

const failed = parsed.filter(r => !r.success)

if (failed.length > 0) {
  console.error('Failed imports:', failed)
  // Log or retry failed documents
}
```

---

## API Key Issues

### Issue: "Generated API key not working"

**Solutions:**

1. **Copy key immediately when created:**
```typescript
// Key value only shown once!
const key = await typesenseClient.keys().create({...})
console.log('SAVE THIS KEY:', key.value)
```

2. **Regenerate if lost:**
```typescript
// Delete old key
await typesenseClient.keys(keyId).delete()

// Create new one
const newKey = await typesenseClient.keys().create({
  description: 'Replacement key',
  actions: ['documents:search'],
  collections: ['*']
})

console.log('New key:', newKey.value)
```

3. **Check key permissions:**
```typescript
// Verify key has required actions
const key = await typesenseClient.keys(keyId).retrieve()
console.log('Actions:', key.actions)
console.log('Collections:', key.collections)
```

---

## Collection Schema Issues

### Issue: "Cannot modify collection schema"

**Symptoms:**
- Cannot add/remove fields
- Cannot change field types
- Update collection fails

**Solutions:**

1. **Use collection migration:**
```typescript
// Create new collection with updated schema
await typesenseClient.collections().create({
  name: 'products_v2',
  fields: [/* updated schema */]
})

// Copy data
const oldDocs = await exportCollection('products')
await importCollection('products_v2', oldDocs)

// Update alias (zero-downtime migration)
await typesenseClient.aliases().upsert('products', {
  collection_name: 'products_v2'
})

// Delete old collection (after verifying)
await typesenseClient.collections('products').delete()
```

2. **Use optional fields:**
```typescript
// Make new fields optional
{
  name: 'new_field',
  type: 'string',
  optional: true // Existing docs don't need this field
}
```

---

## Monitoring and Diagnostics

### Health Check Script

```typescript
import { typesenseClient } from './providers/typesenseClient'

async function healthCheck() {
  console.log('🔍 Typesense Health Check\n')

  // 1. Connection test
  try {
    const health = await typesenseClient.health.retrieve()
    console.log('✅ Server health:', health.ok ? 'OK' : 'FAIL')
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    return
  }

  // 2. Metrics
  try {
    const metrics = await typesenseClient.metrics.json()
    console.log('\n📊 Metrics:')
    console.log('  Memory:', (metrics.system_memory_used_bytes / 1024 / 1024).toFixed(2), 'MB')
    console.log('  CPU:', metrics.system_cpu1_active_percentage, '%')
  } catch (error) {
    console.warn('⚠️  Metrics unavailable')
  }

  // 3. Collections
  try {
    const collections = await typesenseClient.collections().retrieve()
    console.log('\n📚 Collections:', collections.length)
    collections.forEach((col: any) => {
      console.log(`  - ${col.name}: ${col.num_documents} docs`)
    })
  } catch (error) {
    console.error('❌ Failed to list collections:', error.message)
  }

  // 4. Test search
  if (collections.length > 0) {
    const testCol = collections[0].name
    try {
      const start = Date.now()
      const results = await typesenseClient
        .collections(testCol)
        .documents()
        .search({ q: '*', query_by: '*' })
      const duration = Date.now() - start

      console.log(`\n🔍 Test search on "${testCol}":`)
      console.log('  Results:', results.found)
      console.log('  Duration:', duration, 'ms')
    } catch (error) {
      console.error('❌ Search failed:', error.message)
    }
  }

  console.log('\n✅ Health check complete')
}

healthCheck()
```

---

## Common Error Messages

### "Request failed with status code 400"

**Cause:** Invalid request parameters

**Fix:** Check API documentation for correct parameter format

---

### "Request failed with status code 404"

**Cause:** Collection or document not found

**Fix:** Verify resource exists and name is spelled correctly

---

### "Request failed with status code 409"

**Cause:** Resource already exists (creating duplicate)

**Fix:** Use upsert instead of create, or delete existing resource

---

### "Out of memory" errors

**Cause:** Typesense server running out of RAM

**Fix:** Increase server memory or optimize collections

---

## Getting Help

If issues persist after troubleshooting:

1. **Check Typesense logs:**
```bash
docker logs <typesense-container>
```

2. **Check Edge Function logs:**
```bash
supabase functions log sync-to-typesense
```

3. **Check sync logs:**
```sql
SELECT * FROM typesense_sync_log WHERE success = false;
```

4. **Enable debug logging:**
```typescript
localStorage.setItem('debug', 'typesense:*')
// Refresh page and check console
```

5. **Consult documentation:**
- [Typesense Docs](https://typesense.org/docs/)
- [GitHub Issues](https://github.com/typesense/typesense/issues)
- [Typesense Slack](https://typesense.org/slack)

6. **Create support request:**
Include:
- Error messages
- Relevant logs
- Collection schema
- Search query
- System metrics
- Steps to reproduce
