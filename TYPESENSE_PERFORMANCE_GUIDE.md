# Typesense Performance Optimization Guide

Comprehensive guide for optimizing Typesense performance in production environments.

## Table of Contents

1. [Performance Benchmarks](#performance-benchmarks)
2. [Collection Schema Optimization](#collection-schema-optimization)
3. [Query Optimization](#query-optimization)
4. [Indexing Performance](#indexing-performance)
5. [Caching Strategies](#caching-strategies)
6. [Server Configuration](#server-configuration)
7. [Monitoring and Metrics](#monitoring-and-metrics)
8. [Best Practices](#best-practices)

---

## Performance Benchmarks

### Expected Performance

**Search Performance:**
- Simple queries: < 10ms
- Complex queries: < 50ms
- Faceted search: < 100ms
- Target: Sub-100ms for 95th percentile

**Indexing Performance:**
- Single document: < 5ms
- Batch import (100 docs): < 500ms
- Batch import (1000 docs): < 2s
- Target: 100+ documents/second

**Memory Usage:**
- Base: ~50MB
- Per million documents: ~500MB-1GB (varies by schema)
- Target: < 2GB for typical use cases

---

## Collection Schema Optimization

### 1. Field Type Selection

Choose the most specific type possible:

```typescript
// ❌ BAD: Using string for everything
{
  name: 'price',
  type: 'string' // Will be larger, slower
}

// ✅ GOOD: Use appropriate types
{
  name: 'price',
  type: 'float' // Smaller, faster, sortable
}

{
  name: 'is_active',
  type: 'bool' // Much smaller than string
}

{
  name: 'created_at',
  type: 'int64' // Unix timestamp, efficient
}
```

### 2. Optional Fields

Make fields optional when possible:

```typescript
{
  fields: [
    {
      name: 'id',
      type: 'string'
      // required by default
    },
    {
      name: 'rating',
      type: 'float',
      optional: true // Not all docs need this
    },
    {
      name: 'notes',
      type: 'string',
      optional: true // Often empty
    }
  ]
}
```

### 3. Faceting Configuration

Only enable faceting on fields you'll actually filter by:

```typescript
// ❌ BAD: Faceting everything
{
  name: 'description',
  type: 'string',
  facet: true // Long text, never filtered
}

// ✅ GOOD: Strategic faceting
{
  name: 'category',
  type: 'string',
  facet: true // Frequently filtered
}
```

### 4. Array Fields

Use arrays judiciously:

```typescript
// ✅ GOOD: Reasonable array usage
{
  name: 'tags',
  type: 'string[]',
  facet: true
}

// ❌ BAD: Large arrays slow down indexing
{
  name: 'all_words',
  type: 'string[]' // Could be thousands of items
}
```

### 5. Remove Unused Fields

```typescript
// Minimize schema to only what's needed
{
  fields: [
    {name: 'id', type: 'string'},
    {name: 'title', type: 'string'},
    {name: 'price', type: 'float'},
    // Don't include metadata you won't search/filter
  ]
}
```

---

## Query Optimization

### 1. Limit query_by Fields

```typescript
// ❌ BAD: Searching too many fields
{
  q: 'laptop',
  query_by: 'title,description,content,tags,metadata,notes,comments',
  // Slow: searches 7 fields
}

// ✅ GOOD: Only essential fields
{
  q: 'laptop',
  query_by: 'title,description',
  // Fast: searches 2 fields
}
```

### 2. Use Field Weights

Prioritize important fields:

```typescript
{
  q: 'laptop',
  query_by: 'title,description,tags',
  query_by_weights: '3,2,1',
  // Title matches weighted 3x
  // Description 2x
  // Tags 1x
}
```

### 3. Optimize Pagination

```typescript
// ❌ BAD: Requesting too many results
{
  per_page: 1000 // Very slow
}

// ✅ GOOD: Reasonable page size
{
  per_page: 20,
  page: 1
}

// ✅ BETTER: Client-side pagination with offset
{
  per_page: 20,
  offset: 40 // Page 3
}
```

### 4. Field Selection

Only fetch what you need:

```typescript
// ❌ BAD: Fetching all fields
{
  q: 'laptop',
  query_by: 'title',
  // Returns all fields (large response)
}

// ✅ GOOD: Specify needed fields
{
  q: 'laptop',
  query_by: 'title',
  include_fields: 'id,title,price,image_url',
  // Smaller response, faster transfer
}

// ✅ ALSO GOOD: Exclude large fields
{
  q: 'laptop',
  query_by: 'title',
  exclude_fields: 'full_description,reviews',
  // Avoid large text fields
}
```

### 5. Smart Filtering

```typescript
// ✅ Use indexed filters
{
  q: 'laptop',
  query_by: 'title',
  filter_by: 'category:electronics && price:<1000',
  // Fast: uses indexes
}

// ❌ Avoid complex filter expressions
{
  filter_by: '(category:electronics || category:computers) && (price:<1000 || price:>2000) && ...',
  // Slower: complex logic
}
```

### 6. Typo Tolerance Tuning

```typescript
// For autocomplete: strict matching
{
  q: 'lapt',
  query_by: 'title',
  num_typos: 0,
  prefix: true,
  // Fast: prefix matching only
}

// For search: balanced tolerance
{
  q: 'laptop',
  query_by: 'title',
  num_typos: 2,
  typo_tokens_threshold: 1,
  // Moderate: allows some typos
}

// Avoid excessive tolerance
{
  num_typos: 5, // ❌ Too permissive, slower
}
```

---

## Indexing Performance

### 1. Batch Import

Always use batch import for multiple documents:

```typescript
// ❌ BAD: Individual creates (100x slower!)
for (const doc of documents) {
  await typesenseClient
    .collections('products')
    .documents()
    .create(doc)
}
// ~5ms per document = 5000ms total for 1000 docs

// ✅ GOOD: Batch import
await typesenseClient
  .collections('products')
  .documents()
  .import(documents, {
    action: 'create',
    batch_size: 100
  })
// ~2000ms total for 1000 docs
```

### 2. Optimal Batch Size

```typescript
// Test different batch sizes for your data:

// Small batches: More network overhead
batch_size: 10 // Good for: Real-time sync

// Medium batches: Balanced
batch_size: 100 // Good for: General use

// Large batches: Best throughput
batch_size: 500 // Good for: Bulk imports

// Very large: May hit memory limits
batch_size: 1000 // Test carefully
```

### 3. Upsert vs Create

```typescript
// For initial import
{
  action: 'create' // Faster, fails on duplicates
}

// For updates/sync
{
  action: 'upsert' // Slightly slower, handles duplicates
}

// For overwrites
{
  action: 'update' // Updates existing, fails on missing
}
```

### 4. Async Indexing

```typescript
// Don't wait for indexing in critical paths
async function createProduct(data: any) {
  // Write to Supabase first
  const { data: product } = await supabase
    .from('products')
    .insert(data)

  // Async index to Typesense (don't await)
  indexToTypesense(product).catch(console.error)

  // Return immediately
  return product
}
```

---

## Caching Strategies

### 1. Client-Side Caching

Use SearchClient for automatic caching:

```typescript
import Typesense from 'typesense'

// SearchClient with 5-minute cache
const searchClient = new Typesense.SearchClient({
  nodes: [{
    host: 'localhost',
    port: 8108,
    protocol: 'http'
  }],
  apiKey: 'search-key',
  cacheSearchResultsForSeconds: 300, // 5 minutes
})

// Identical queries within 5 minutes use cached results
const results1 = await searchClient.collections('products').documents().search({...})
const results2 = await searchClient.collections('products').documents().search({...})
// results2 served from cache
```

### 2. Application-Level Caching

```typescript
import { LRUCache } from 'lru-cache'

// Create cache
const searchCache = new LRUCache<string, any>({
  max: 500, // 500 cached searches
  ttl: 1000 * 60 * 5, // 5 minutes
})

async function cachedSearch(query: string, params: any) {
  const cacheKey = JSON.stringify({ query, params })

  // Check cache
  const cached = searchCache.get(cacheKey)
  if (cached) {
    console.log('Cache hit')
    return cached
  }

  // Execute search
  const results = await typesenseClient
    .collections('products')
    .documents()
    .search(params)

  // Store in cache
  searchCache.set(cacheKey, results)

  return results
}
```

### 3. CDN Caching

For public search endpoints:

```nginx
# nginx configuration
location /api/search {
    proxy_pass http://typesense:8108;

    # Cache GET requests
    proxy_cache my_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$request_uri";

    add_header X-Cache-Status $upstream_cache_status;
}
```

### 4. Preload Common Searches

```typescript
// Warm up cache with popular searches
const popularQueries = ['laptop', 'phone', 'tablet', 'headphones']

async function warmupCache() {
  for (const query of popularQueries) {
    await searchClient
      .collections('products')
      .documents()
      .search({
        q: query,
        query_by: 'title,description',
      })
  }
  console.log('Cache warmed up')
}

// Run on startup
warmupCache()
```

---

## Server Configuration

### 1. Memory Allocation

```bash
# Docker: Allocate adequate memory
docker run \
  -m 2g \  # 2GB memory limit
  --memory-swap 2g \
  typesense/typesense:26.0 \
  --data-dir /data
```

### 2. CPU Allocation

```bash
# Docker: Limit CPU if needed
docker run \
  --cpus=2 \  # 2 CPU cores
  typesense/typesense:26.0
```

### 3. Disk I/O

```bash
# Use fast storage (SSD recommended)
docker run \
  -v /fast-ssd/typesense-data:/data \
  typesense/typesense:26.0 \
  --data-dir /data
```

### 4. Network Configuration

```bash
# Tune connection settings
docker run \
  typesense/typesense:26.0 \
  --thread-pool-size 8 \  # Adjust based on CPU cores
  --num-collections-parallel-load 4
```

### 5. High Availability Setup

```bash
# Multi-node cluster for failover
docker-compose up -d

# Configure in client
const client = new Typesense.Client({
  nodes: [
    { host: 'node1', port: 8108, protocol: 'https' },
    { host: 'node2', port: 8108, protocol: 'https' },
    { host: 'node3', port: 8108, protocol: 'https' },
  ],
  apiKey: 'xyz',
  numRetries: 3,
  healthcheckIntervalSeconds: 60,
})
```

---

## Monitoring and Metrics

### 1. Health Checks

```typescript
async function monitorHealth() {
  setInterval(async () => {
    try {
      const health = await typesenseClient.health.retrieve()

      if (!health.ok) {
        // Alert: Typesense unhealthy
        console.error('Typesense is unhealthy!')
      }
    } catch (error) {
      // Alert: Cannot reach Typesense
      console.error('Cannot reach Typesense:', error)
    }
  }, 30000) // Every 30 seconds
}
```

### 2. Performance Metrics

```typescript
async function collectMetrics() {
  const metrics = await typesenseClient.metrics.json()

  return {
    memory_used_mb: metrics.system_memory_used_bytes / 1024 / 1024,
    cpu_percent: metrics.system_cpu1_active_percentage,
    disk_used_mb: metrics.system_disk1_used_bytes / 1024 / 1024,

    // Request metrics
    total_requests: metrics.total_requests,
    latency_ms: metrics.latency_ms,
  }
}

// Log metrics
setInterval(async () => {
  const metrics = await collectMetrics()
  console.log('Metrics:', metrics)
}, 60000) // Every minute
```

### 3. Search Performance Tracking

```typescript
// Track search times
const searchTimes: number[] = []

async function monitoredSearch(params: any) {
  const start = Date.now()

  const results = await typesenseClient
    .collections('products')
    .documents()
    .search(params)

  const duration = Date.now() - start

  searchTimes.push(duration)

  // Alert on slow searches
  if (duration > 100) {
    console.warn('Slow search:', duration, 'ms', params)
  }

  return results
}

// Calculate stats
function getSearchStats() {
  const sorted = searchTimes.sort((a, b) => a - b)
  return {
    avg: searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length,
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  }
}
```

---

## Best Practices

### 1. Schema Design Checklist

- ✅ Use specific types (not all strings)
- ✅ Make fields optional when possible
- ✅ Only facet fields you'll filter
- ✅ Use int64 for timestamps
- ✅ Limit array field sizes
- ✅ Remove unused fields

### 2. Query Optimization Checklist

- ✅ Limit query_by to 2-3 fields
- ✅ Use field weights appropriately
- ✅ Keep per_page ≤ 50
- ✅ Use include_fields/exclude_fields
- ✅ Tune typo tolerance per use case
- ✅ Simplify filter expressions

### 3. Indexing Best Practices

- ✅ Always use batch import
- ✅ Use batch_size: 100-500
- ✅ Use 'upsert' for sync
- ✅ Index asynchronously
- ✅ Monitor import failures

### 4. Caching Strategy

- ✅ Use SearchClient for read-heavy workloads
- ✅ Cache common queries
- ✅ Set appropriate TTLs
- ✅ Warm up cache on startup
- ✅ Use CDN for public APIs

### 5. Production Readiness

- ✅ Allocate adequate memory (2GB+)
- ✅ Use SSD storage
- ✅ Set up monitoring and alerts
- ✅ Configure multi-node for HA
- ✅ Regular backups
- ✅ Load testing before launch

---

## Performance Testing

### Load Test Script

```typescript
import Typesense from 'typesense'

async function loadTest() {
  const client = new Typesense.Client({
    nodes: [{ host: 'localhost', port: 8108, protocol: 'http' }],
    apiKey: 'xyz',
  })

  const queries = ['laptop', 'phone', 'tablet', 'headphones', 'mouse']
  const iterations = 1000
  const concurrent = 10

  const startTime = Date.now()
  const promises: Promise<any>[] = []

  for (let i = 0; i < iterations; i++) {
    const query = queries[i % queries.length]

    const promise = client
      .collections('products')
      .documents()
      .search({
        q: query,
        query_by: 'title,description',
        per_page: 20,
      })

    promises.push(promise)

    // Limit concurrency
    if (promises.length >= concurrent) {
      await Promise.race(promises)
      promises.splice(0, 1)
    }
  }

  // Wait for remaining
  await Promise.all(promises)

  const duration = Date.now() - startTime
  const qps = (iterations / duration) * 1000

  console.log(`Completed ${iterations} queries in ${duration}ms`)
  console.log(`Throughput: ${qps.toFixed(2)} queries/second`)
}

loadTest()
```

---

## Optimization Roadmap

### Phase 1: Quick Wins (1 week)
1. ✅ Enable SearchClient caching
2. ✅ Use batch imports everywhere
3. ✅ Limit query_by fields
4. ✅ Add field selection

### Phase 2: Schema Optimization (2 weeks)
1. ✅ Review and optimize field types
2. ✅ Remove unused fields
3. ✅ Configure faceting properly
4. ✅ Make fields optional

### Phase 3: Advanced (1 month)
1. ✅ Implement application caching
2. ✅ Set up monitoring
3. ✅ Multi-node deployment
4. ✅ CDN integration

### Phase 4: Fine-tuning (Ongoing)
1. ✅ Monitor metrics
2. ✅ A/B test configurations
3. ✅ Regular performance reviews
4. ✅ Optimize based on usage patterns

---

For more information:
- [Typesense Performance Tips](https://typesense.org/docs/guide/performance.html)
- [TYPESENSE_USAGE_GUIDE.md](./TYPESENSE_USAGE_GUIDE.md)
- [TYPESENSE_TROUBLESHOOTING.md](./TYPESENSE_TROUBLESHOOTING.md)
