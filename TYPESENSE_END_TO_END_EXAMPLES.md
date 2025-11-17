# Typesense End-to-End Examples

This guide provides complete, real-world examples of using Typesense integration in the Supabase Admin Panel.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [E-commerce Product Search](#e-commerce-product-search)
3. [Document Management System](#document-management-system)
4. [Multi-Tenant Search](#multi-tenant-search)
5. [Auto-Sync with Supabase](#auto-sync-with-supabase)
6. [Advanced Search Features](#advanced-search-features)
7. [Analytics Integration](#analytics-integration)

---

## Basic Setup

### Prerequisites

```bash
# 1. Start Typesense server
docker run -d \
  -p 8108:8108 \
  -v /tmp/typesense-data:/data \
  typesense/typesense:26.0 \
  --data-dir /data \
  --api-key=xyz123 \
  --enable-cors

# 2. Set environment variables in .env
VITE_TYPESENSE_URL=http://localhost:8108
VITE_TYPESENSE_API_KEY=xyz123
```

### Test Connection

```typescript
import { typesenseClient } from './providers/typesenseClient'

// Test health
const health = await typesenseClient.health.retrieve()
console.log('Typesense is healthy:', health.ok)
```

---

## E-commerce Product Search

### Step 1: Create Product Collection

Navigate to **Collections** in the admin panel and create:

```json
{
  "name": "products",
  "fields": [
    {
      "name": "id",
      "type": "string"
    },
    {
      "name": "name",
      "type": "string"
    },
    {
      "name": "description",
      "type": "string"
    },
    {
      "name": "category",
      "type": "string",
      "facet": true
    },
    {
      "name": "brand",
      "type": "string",
      "facet": true
    },
    {
      "name": "price",
      "type": "float"
    },
    {
      "name": "rating",
      "type": "float",
      "optional": true
    },
    {
      "name": "in_stock",
      "type": "bool"
    },
    {
      "name": "tags",
      "type": "string[]",
      "facet": true
    },
    {
      "name": "created_at",
      "type": "int64"
    }
  ],
  "default_sorting_field": "created_at"
}
```

### Step 2: Import Sample Products

Navigate to **TS Documents** and import (JSONL format):

```jsonl
{"id":"1","name":"Premium Laptop","description":"High-performance laptop for professionals","category":"Electronics","brand":"TechCo","price":1299.99,"rating":4.5,"in_stock":true,"tags":["laptop","computer","premium"],"created_at":1699564800}
{"id":"2","name":"Wireless Mouse","description":"Ergonomic wireless mouse","category":"Electronics","brand":"TechCo","price":29.99,"rating":4.2,"in_stock":true,"tags":["mouse","wireless","accessories"],"created_at":1699651200}
{"id":"3","name":"USB-C Cable","description":"Fast charging USB-C cable","category":"Electronics","brand":"CablePro","price":12.99,"rating":4.0,"in_stock":false,"tags":["cable","usb","charging"],"created_at":1699737600}
```

### Step 3: Configure Synonyms

Navigate to **Synonyms** and create:

```json
{
  "id": "laptop-synonyms",
  "synonyms": ["laptop", "notebook", "portable computer", "laptop computer"]
}
```

```json
{
  "id": "phone-synonyms",
  "synonyms": ["phone", "mobile", "smartphone", "cell phone"]
}
```

### Step 4: Set Up Curations

Navigate to **Curations** and promote specific products for "best laptop":

```json
{
  "rule": {
    "query": "best laptop",
    "match": "exact"
  },
  "includes": [
    {"id": "1", "position": 1}
  ]
}
```

### Step 5: Create Search Preset

Navigate to **Search Presets** and create "Popular Products":

```json
{
  "name": "popular-products",
  "value": {
    "query_by": "name,description,tags",
    "sort_by": "rating:desc",
    "filter_by": "in_stock:true",
    "per_page": 20
  }
}
```

### Step 6: Perform Multi-Search

Navigate to **Multi-Search** and execute:

```json
{
  "searches": [
    {
      "collection": "products",
      "q": "laptop",
      "query_by": "name,description",
      "filter_by": "in_stock:true",
      "sort_by": "price:asc",
      "per_page": 10
    }
  ]
}
```

### Step 7: Implement in Your App

```typescript
import { typesenseSearchClient } from './providers/typesenseClient'

async function searchProducts(query: string, filters?: any) {
  const searchParams = {
    q: query,
    query_by: 'name,description,tags',
    filter_by: [
      filters?.inStock ? 'in_stock:true' : '',
      filters?.category ? `category:${filters.category}` : '',
      filters?.priceMin ? `price:>=${filters.priceMin}` : '',
      filters?.priceMax ? `price:<=${filters.priceMax}` : '',
    ].filter(Boolean).join(' && '),
    facet_by: 'category,brand,tags',
    sort_by: filters?.sortBy || 'rating:desc',
    per_page: 20,
    page: filters?.page || 1,
  }

  const results = await typesenseSearchClient
    .collections('products')
    .documents()
    .search(searchParams)

  return {
    products: results.hits?.map(hit => hit.document) || [],
    facets: results.facet_counts,
    total: results.found,
    page: results.page,
  }
}

// Usage
const results = await searchProducts('laptop', {
  inStock: true,
  category: 'Electronics',
  priceMin: 0,
  priceMax: 1500,
  sortBy: 'price:asc',
  page: 1
})
```

---

## Document Management System

### Step 1: Create Documents Collection

```json
{
  "name": "documents",
  "fields": [
    {
      "name": "id",
      "type": "string"
    },
    {
      "name": "title",
      "type": "string"
    },
    {
      "name": "content",
      "type": "string"
    },
    {
      "name": "author",
      "type": "string",
      "facet": true
    },
    {
      "name": "document_type",
      "type": "string",
      "facet": true
    },
    {
      "name": "tags",
      "type": "string[]",
      "facet": true
    },
    {
      "name": "tenant_id",
      "type": "string"
    },
    {
      "name": "created_at",
      "type": "int64"
    },
    {
      "name": "updated_at",
      "type": "int64"
    }
  ],
  "default_sorting_field": "updated_at"
}
```

### Step 2: Enable Auto-Sync

In Supabase SQL Editor:

```sql
-- Enable auto-sync for documents table
CREATE TRIGGER trigger_sync_documents_to_typesense
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION sync_to_typesense();
```

### Step 3: Batch Sync Existing Documents

```sql
-- Sync first 1000 documents
SELECT batch_sync_to_typesense('documents', 1000, 0);

-- Check sync status
SELECT * FROM typesense_sync_log
WHERE table_name = 'documents'
ORDER BY synced_at DESC
LIMIT 20;
```

### Step 4: Full-Text Search with Highlighting

```typescript
async function searchDocuments(query: string, tenantId: string) {
  const results = await typesenseSearchClient
    .collections('documents')
    .documents()
    .search({
      q: query,
      query_by: 'title,content',
      filter_by: `tenant_id:=${tenantId}`,
      highlight_full_fields: 'content',
      highlight_affix_num_tokens: 4,
      snippet_threshold: 30,
      per_page: 20,
    })

  return results.hits?.map(hit => ({
    id: hit.document.id,
    title: hit.document.title,
    author: hit.document.author,
    // Get highlighted snippet
    snippet: hit.highlights?.find(h => h.field === 'content')?.snippet || '',
    // Text match score
    score: hit.text_match,
  })) || []
}
```

---

## Multi-Tenant Search

### Step 1: Create Scoped API Keys

Navigate to **TS API Keys** and create tenant-specific keys:

```json
{
  "description": "Search key for Tenant A",
  "actions": ["documents:search"],
  "collections": ["documents"],
  "filter_by": "tenant_id:=tenant-a-uuid"
}
```

### Step 2: Use Scoped Keys in Frontend

```typescript
// Create tenant-specific search client
const createTenantSearchClient = (apiKey: string) => {
  return new Typesense.SearchClient({
    nodes: [{
      host: 'localhost',
      port: 8108,
      protocol: 'http'
    }],
    apiKey: apiKey, // Tenant-specific key
    connectionTimeoutSeconds: 2,
    cacheSearchResultsForSeconds: 300,
  })
}

// Search will automatically be filtered to tenant's data
const tenantClient = createTenantSearchClient(tenantApiKey)
const results = await tenantClient
  .collections('documents')
  .documents()
  .search({
    q: 'contract',
    query_by: 'title,content'
  })
```

---

## Auto-Sync with Supabase

### Complete Auto-Sync Setup

#### 1. Deploy Edge Functions

```bash
# Deploy sync function
supabase functions deploy sync-to-typesense

# Deploy batch sync function
supabase functions deploy batch-sync-to-typesense

# Set environment secrets
supabase secrets set TYPESENSE_HOST=localhost
supabase secrets set TYPESENSE_PORT=8108
supabase secrets set TYPESENSE_PROTOCOL=http
supabase secrets set TYPESENSE_API_KEY=xyz123
```

#### 2. Run Migration

```bash
supabase migration up
```

#### 3. Enable for Specific Tables

```sql
-- Documents table
CREATE TRIGGER trigger_sync_documents_to_typesense
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION sync_to_typesense();

-- Products table
CREATE TRIGGER trigger_sync_products_to_typesense
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_to_typesense();
```

#### 4. Test Auto-Sync

```sql
-- Insert a test document
INSERT INTO documents (id, title, content, tenant_id, author, document_type, tags)
VALUES (
  gen_random_uuid(),
  'Test Document',
  'This is a test document for auto-sync',
  'tenant-123',
  'John Doe',
  'memo',
  ARRAY['test', 'sync']
);

-- Check if it was synced
SELECT * FROM typesense_sync_log ORDER BY synced_at DESC LIMIT 1;
```

#### 5. Verify in Typesense

Navigate to **TS Documents**, select `documents` collection, and search for "Test Document".

---

## Advanced Search Features

### 1. Typo Tolerance

```typescript
const results = await typesenseSearchClient
  .collections('products')
  .documents()
  .search({
    q: 'laptoop', // Typo: should find "laptop"
    query_by: 'name,description',
    num_typos: 2, // Allow up to 2 typos
    typo_tokens_threshold: 1,
  })
```

### 2. Prefix Search (Autocomplete)

```typescript
async function autocomplete(prefix: string) {
  const results = await typesenseSearchClient
    .collections('products')
    .documents()
    .search({
      q: prefix,
      query_by: 'name',
      prefix: true, // Enable prefix matching
      per_page: 10,
    })

  return results.hits?.map(hit => hit.document.name) || []
}

// Usage
const suggestions = await autocomplete('lap') // Returns: ["laptop", "laptop bag", ...]
```

### 3. Faceted Search

```typescript
async function facetedSearch(query: string, selectedFacets: any = {}) {
  const results = await typesenseSearchClient
    .collections('products')
    .documents()
    .search({
      q: query,
      query_by: 'name,description',
      facet_by: 'category,brand,tags',
      max_facet_values: 50,
      filter_by: [
        selectedFacets.category ? `category:${selectedFacets.category}` : '',
        selectedFacets.brand ? `brand:${selectedFacets.brand}` : '',
        selectedFacets.tags?.length ? `tags:[${selectedFacets.tags.join(',')}]` : '',
      ].filter(Boolean).join(' && '),
    })

  return {
    products: results.hits?.map(hit => hit.document) || [],
    facets: {
      category: results.facet_counts?.find(f => f.field_name === 'category')?.counts || [],
      brand: results.facet_counts?.find(f => f.field_name === 'brand')?.counts || [],
      tags: results.facet_counts?.find(f => f.field_name === 'tags')?.counts || [],
    }
  }
}
```

### 4. Geospatial Search

```json
// Collection with geolocation
{
  "name": "stores",
  "fields": [
    {"name": "id", "type": "string"},
    {"name": "name", "type": "string"},
    {"name": "location", "type": "geopoint"},
    {"name": "created_at", "type": "int64"}
  ],
  "default_sorting_field": "created_at"
}
```

```typescript
// Search stores within 10km radius
const results = await typesenseSearchClient
  .collections('stores')
  .documents()
  .search({
    q: '*',
    filter_by: 'location:(40.7128, -74.0060, 10 km)', // NYC, 10km radius
    sort_by: 'location(40.7128, -74.0060):asc', // Sort by distance
  })
```

### 5. Vector Search (Semantic)

```json
// Collection with embeddings
{
  "name": "articles",
  "fields": [
    {"name": "id", "type": "string"},
    {"name": "title", "type": "string"},
    {"name": "content", "type": "string"},
    {"name": "embedding", "type": "float[]", "num_dim": 384}
  ]
}
```

```typescript
// Semantic search using embeddings
const results = await typesenseSearchClient
  .collections('articles')
  .documents()
  .search({
    q: '*',
    vector_query: 'embedding:([0.234, 0.567, ...], k:10)',
  })
```

---

## Analytics Integration

### 1. Track Search Events

```typescript
import { typesenseClient } from './providers/typesenseClient'

async function trackSearch(query: string, userId: string, results: number) {
  await typesenseClient.analytics.events().create({
    type: 'search',
    name: 'product_search',
    data: {
      q: query,
      user_id: userId,
      results_count: results,
      timestamp: Date.now(),
    }
  })
}

// Usage in search function
async function searchWithAnalytics(query: string, userId: string) {
  const results = await typesenseSearchClient
    .collections('products')
    .documents()
    .search({
      q: query,
      query_by: 'name,description',
    })

  // Track the search
  await trackSearch(query, userId, results.found)

  return results
}
```

### 2. Track Click Events

```typescript
async function trackClick(documentId: string, query: string, position: number) {
  await typesenseClient.analytics.events().create({
    type: 'click',
    name: 'product_click',
    data: {
      document_id: documentId,
      query: query,
      position: position,
      timestamp: Date.now(),
    }
  })
}
```

### 3. View Analytics Dashboard

Navigate to **Analytics** in the admin panel to view:

- Search volume over time
- Popular queries
- No-result queries
- Click-through rates
- Average result counts

---

## Performance Optimization

### 1. Use Batch Operations

```typescript
// BAD: Individual inserts
for (const product of products) {
  await typesenseClient
    .collections('products')
    .documents()
    .create(product)
}

// GOOD: Batch import
await typesenseClient
  .collections('products')
  .documents()
  .import(products, {
    action: 'upsert',
    batch_size: 100
  })
```

### 2. Field Selection

```typescript
// Only fetch needed fields
const results = await typesenseSearchClient
  .collections('products')
  .documents()
  .search({
    q: 'laptop',
    query_by: 'name,description',
    include_fields: 'id,name,price,rating', // Only these fields
  })
```

### 3. Result Caching

```typescript
// SearchClient automatically caches results for 5 minutes
const searchClient = new Typesense.SearchClient({
  nodes: [{ host: 'localhost', port: 8108, protocol: 'http' }],
  apiKey: 'search-key',
  cacheSearchResultsForSeconds: 300, // 5 minutes
})
```

---

## Complete Example: E-commerce Search Page

```typescript
import { useState, useEffect } from 'react'
import { typesenseSearchClient } from './providers/typesenseClient'

interface SearchFilters {
  category?: string
  brand?: string
  priceMin?: number
  priceMax?: number
  inStock?: boolean
  tags?: string[]
  sortBy?: string
}

export function ProductSearch() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [results, setResults] = useState([])
  const [facets, setFacets] = useState({})
  const [loading, setLoading] = useState(false)

  const search = async () => {
    setLoading(true)
    try {
      const filterConditions = [
        filters.inStock ? 'in_stock:true' : '',
        filters.category ? `category:${filters.category}` : '',
        filters.brand ? `brand:${filters.brand}` : '',
        filters.priceMin ? `price:>=${filters.priceMin}` : '',
        filters.priceMax ? `price:<=${filters.priceMax}` : '',
        filters.tags?.length ? `tags:[${filters.tags.join(',')}]` : '',
      ].filter(Boolean).join(' && ')

      const searchResults = await typesenseSearchClient
        .collections('products')
        .documents()
        .search({
          q: query || '*',
          query_by: 'name,description,tags',
          filter_by: filterConditions,
          facet_by: 'category,brand,tags',
          sort_by: filters.sortBy || 'rating:desc',
          per_page: 20,
          highlight_full_fields: 'name,description',
        })

      setResults(searchResults.hits?.map(hit => hit.document) || [])
      setFacets({
        categories: searchResults.facet_counts?.find(f => f.field_name === 'category')?.counts || [],
        brands: searchResults.facet_counts?.find(f => f.field_name === 'brand')?.counts || [],
        tags: searchResults.facet_counts?.find(f => f.field_name === 'tags')?.counts || [],
      })
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    search()
  }, [query, filters])

  return (
    <div className="product-search">
      {/* Search input */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
      />

      {/* Filters */}
      <div className="filters">
        {/* Category facets */}
        {facets.categories?.map(cat => (
          <button
            key={cat.value}
            onClick={() => setFilters({...filters, category: cat.value})}
          >
            {cat.value} ({cat.count})
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="results">
        {loading ? (
          <div>Loading...</div>
        ) : (
          results.map(product => (
            <div key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p>${product.price}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

---

## Troubleshooting

### Connection Issues

```typescript
// Test connection
try {
  const health = await typesenseClient.health.retrieve()
  console.log('Typesense is healthy:', health)
} catch (error) {
  console.error('Connection failed:', error)
  // Check: VITE_TYPESENSE_URL and VITE_TYPESENSE_API_KEY
}
```

### Sync Issues

```sql
-- Check sync logs
SELECT * FROM typesense_sync_log
WHERE success = false
ORDER BY synced_at DESC;

-- Manually re-sync
SELECT batch_sync_to_typesense('documents', 1000, 0);
```

### Performance Issues

```typescript
// Check system metrics
const metrics = await typesenseClient.metrics.json()
console.log('Latency:', metrics.latency_ms)
console.log('Memory:', metrics.memory_used_bytes)
```

---

## Next Steps

1. Set up monitoring alerts for Typesense health
2. Configure backup and disaster recovery
3. Optimize collection schemas based on query patterns
4. Implement A/B testing for search relevance
5. Set up search analytics dashboards

For more information, see:
- [Typesense Documentation](https://typesense.org/docs/)
- [TYPESENSE_USAGE_GUIDE.md](./TYPESENSE_USAGE_GUIDE.md)
- [TYPESENSE_SETUP.md](./TYPESENSE_SETUP.md)
