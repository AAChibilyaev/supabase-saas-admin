# Typesense Setup Guide

This guide explains how to set up Typesense integration in the Supabase Admin Panel.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Typesense server running (local or cloud)

## Installation

### 1. Install Dependencies

The required npm packages are already installed in this project:

```bash
npm install typesense @babel/runtime
```

**Packages:**
- `typesense` (v2.1.0) - Official Typesense JavaScript client
- `@babel/runtime` (v7.28.4) - Peer dependency for minimal bundle size

### 2. Configure Environment Variables

Add the following variables to your `.env` file:

```env
# Required: Typesense server URL and API key
VITE_TYPESENSE_URL=http://localhost:8108
VITE_TYPESENSE_API_KEY=your-api-key

# Optional: Search-only API key for frontend (recommended for security)
VITE_TYPESENSE_SEARCH_API_KEY=search-only-key

# Optional: Multiple nodes for failover (JSON array format)
VITE_TYPESENSE_ADDITIONAL_NODES=[{"host":"node2.example.com","port":8108,"protocol":"https"}]
```

**Configuration Notes:**

- **VITE_TYPESENSE_URL**: Full URL to your Typesense server (e.g., `http://localhost:8108`, `https://api.typesense.com`)
- **VITE_TYPESENSE_API_KEY**: Admin API key for full access
- **VITE_TYPESENSE_SEARCH_API_KEY**: (Optional) Search-only key for frontend security
- **VITE_TYPESENSE_ADDITIONAL_NODES**: (Optional) Additional nodes for high availability

## Architecture

### File Structure

```
src/providers/
├── typesenseClient.ts          # Typesense client configuration
├── typesenseDataProvider.ts    # Data provider for Typesense resources
├── compositeDataProvider.ts    # Routes requests between Supabase and Typesense
└── dataProvider.ts             # Original Supabase data provider
```

### Client Configuration

The Typesense client is configured with:

- **Connection timeout**: 10 seconds
- **Retry attempts**: 3 retries with exponential backoff
- **Retry interval**: 0.1 seconds initial delay
- **Health checks**: Every 60 seconds
- **Log level**: info

### Search Client (Optional)

A separate SearchClient is available for frontend use with:

- **Shorter timeout**: 2 seconds (for better UX)
- **Result caching**: 5 minutes (300 seconds)
- **Search-only API key**: Uses VITE_TYPESENSE_SEARCH_API_KEY if available

## Client Features

### Automatic Retry and Failover

The client automatically retries failed requests and switches between nodes:

```typescript
// Configured in typesenseClient.ts
{
  numRetries: 3,
  retryIntervalSeconds: 0.1,
  healthcheckIntervalSeconds: 60
}
```

### Connection Pooling

The client reuses HTTP connections for better performance.

### Bulk Operations

The data provider uses bulk operations for maximum performance:

```typescript
// Example: updateMany uses bulk import
await typesenseClient
  .collections(resource)
  .documents()
  .import(documents, { action: 'upsert', batch_size: 100 })
```

## Usage

### Composite Data Provider

The app uses a composite data provider that automatically routes requests:

- **Typesense resources** (prefixed with `typesense-`) → Typesense
- **Search operations** with query → Typesense (if configured)
- **All other operations** → Supabase

```typescript
// Configured in App.tsx
<Admin dataProvider={compositeDataProvider}>
  {/* Resources */}
</Admin>
```

### Available Typesense Resources

The following resources are available in the admin panel:

- `typesense-keys` - API Keys Management
- `typesense-aliases` - Collection Aliases
- `typesense-synonyms` - Synonym Sets
- `typesense-curations` - Curation Sets (Overrides)
- `typesense-stopwords` - Stopwords Management
- `typesense-stemming` - Stemming Dictionaries
- `typesense-nl-models` - Natural Language Search Models
- `typesense-conversations` - Conversation Models (RAG)
- `typesense-analytics` - Analytics Dashboard
- `typesense-system` - System Operations & Monitoring
- `presets` - Search Presets

## Testing Connection

To verify your Typesense connection, you can add this test to your code:

```typescript
import { typesenseClient } from './providers/typesenseClient'

async function testTypesenseConnection() {
  if (!typesenseClient) {
    console.error('Typesense client is not initialized')
    return
  }

  try {
    const health = await typesenseClient.health.retrieve()
    console.log('✅ Typesense connection successful:', health)

    const collections = await typesenseClient.collections().retrieve()
    console.log(`📚 Found ${collections.length} collections`)
  } catch (error) {
    console.error('❌ Typesense connection failed:', error)
  }
}
```

## Performance Best Practices

### DO:

- ✅ Use `typesenseClient.collections().documents().import()` for bulk operations
- ✅ Use `batch_size` parameter for large imports (recommended: 100-1000)
- ✅ Use `SearchClient` with caching for frontend search
- ✅ Enable `numRetries` and `healthcheckIntervalSeconds`
- ✅ Use search-only API keys in production frontends

### DON'T:

- ❌ Don't make single document requests in loops
- ❌ Don't use direct fetch/axios calls (use the official client)
- ❌ Don't skip error handling
- ❌ Don't hardcode credentials
- ❌ Don't expose admin API keys to the frontend

## Running Typesense Server

### Docker (Recommended)

```bash
docker run -d \
  -p 8108:8108 \
  -v /tmp/typesense-data:/data \
  typesense/typesense:26.0 \
  --data-dir /data \
  --api-key=your-api-key \
  --enable-cors
```

### Docker Compose

```yaml
version: '3.8'
services:
  typesense:
    image: typesense/typesense:26.0
    ports:
      - "8108:8108"
    volumes:
      - ./typesense-data:/data
    command: >
      --data-dir /data
      --api-key=your-api-key
      --enable-cors
```

### Typesense Cloud

For production, consider using [Typesense Cloud](https://cloud.typesense.org/) for managed hosting.

## Troubleshooting

### Client not initialized

**Error**: "Typesense client is not initialized"

**Solution**: Check that:
1. `VITE_TYPESENSE_URL` is set in `.env`
2. `VITE_TYPESENSE_API_KEY` is set in `.env`
3. The Typesense server is running
4. The URL is accessible from your application

### Connection timeout

**Error**: Connection timeout errors

**Solution**:
1. Verify Typesense server is running: `curl http://localhost:8108/health`
2. Check firewall settings
3. Verify the URL and port are correct
4. Check network connectivity

### CORS errors

**Error**: CORS policy blocking requests

**Solution**: Start Typesense with `--enable-cors` flag:

```bash
docker run -p 8108:8108 typesense/typesense:26.0 --enable-cors
```

## Security Considerations

### API Key Scoping

Create different API keys for different purposes:

```bash
# Admin key (full access) - backend only
VITE_TYPESENSE_API_KEY=admin-key-xyz

# Search-only key (read-only) - safe for frontend
VITE_TYPESENSE_SEARCH_API_KEY=search-key-abc
```

### Create Search-Only API Key

```typescript
await typesenseClient.keys().create({
  description: 'Search-only key',
  actions: ['documents:search'],
  collections: ['*']
})
```

## Next Steps

After setting up Typesense:

1. **Create Collections**: Use the Collections Management interface
2. **Import Documents**: Bulk import your data
3. **Configure Search**: Set up synonyms, curations, and presets
4. **Monitor Performance**: Use the Analytics Dashboard
5. **Set Up Alerts**: Configure system monitoring

## Additional Resources

- [Typesense Documentation](https://typesense.org/docs/)
- [Typesense-JS GitHub](https://github.com/typesense/typesense-js)
- [API Reference](https://typesense.org/docs/api/)
- [Performance Best Practices](https://typesense.org/docs/guide/syncing-data-into-typesense.html)
- [TYPESENSE_CLIENT_ANALYSIS.md](./TYPESENSE_CLIENT_ANALYSIS.md) - Performance comparison
- [TYPESENSE_INTEGRATION.md](./TYPESENSE_INTEGRATION.md) - Integration roadmap

## Support

For issues and questions:

- [GitHub Issues](https://github.com/AAChibilyaev/supabase-saas-admin/issues)
- [Typesense Slack](https://typesense.org/slack)
- [Typesense GitHub](https://github.com/typesense/typesense)
