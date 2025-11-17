# OpenAI Embeddings Integration

## Overview

This document describes the OpenAI embeddings integration for automatic vector embedding generation. The system supports multiple OpenAI embedding models and provides batch processing, analytics, and cost tracking.

## Features

### 1. Automatic Embedding Generation
- Generate embeddings on document create
- Manual trigger for individual documents
- Batch processing for multiple documents
- Automatic retry on failure
- Content hash tracking to detect changes

### 2. Multiple Model Support
The system supports three OpenAI embedding models:

| Model | Dimensions | Cost per 1M tokens | Use Case |
|-------|------------|-------------------|----------|
| text-embedding-3-small | 1536 | $0.02 | General purpose, cost-effective (Recommended) |
| text-embedding-3-large | 3072 | $0.13 | Higher accuracy, semantic search |
| text-embedding-ada-002 | 1536 | $0.10 | Legacy model, still supported |

### 3. Cost Tracking
- Real-time cost calculation
- Token usage monitoring
- Per-model cost breakdown
- Total cost estimation

### 4. Analytics Dashboard
- Total embeddings generated
- Success/failure rates
- Average processing time
- Model usage distribution

## Setup

### 1. Install Dependencies

```bash
npm install openai
```

### 2. Environment Variables

Add to your `.env` file:

```env
# Frontend (for development/testing only)
VITE_OPENAI_API_KEY=sk-your-openai-api-key
```

### 3. Edge Function Configuration

Set the following secret in your Supabase project:

```bash
# Using Supabase CLI
npx supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key

# Or using the Supabase Dashboard:
# Settings > Edge Functions > Add secret
```

### 4. Deploy Edge Functions

```bash
# Deploy single embedding function
npx supabase functions deploy generate-embedding

# Deploy batch embedding function
npx supabase functions deploy generate-batch-embeddings
```

## Usage

### Frontend Usage

#### 1. Import the Service

```typescript
import { generateEmbedding, EMBEDDING_MODELS } from '@/services/openai'
```

#### 2. Generate Embedding

```typescript
const result = await generateEmbedding(documentContent, {
  model: 'text-embedding-3-small',
  maxTokens: 8000,
})

if (result.success) {
  console.log('Embedding:', result.embedding)
  console.log('Dimensions:', result.dimensions)
  console.log('Tokens used:', result.tokens)
  console.log('Processing time:', result.processingTime, 'ms')
}
```

#### 3. Batch Processing

```typescript
import { generateBatchEmbeddings } from '@/services/openai'

const texts = ['Document 1 content', 'Document 2 content']
const results = await generateBatchEmbeddings(texts, {
  model: 'text-embedding-3-small'
}, (completed, total) => {
  console.log(`Progress: ${completed}/${total}`)
})
```

### Edge Function Usage

#### 1. Generate Single Embedding

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/generate-embedding' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "uuid-here",
    "model": "text-embedding-3-small",
    "forceRegenerate": false
  }'
```

Response:
```json
{
  "success": true,
  "documentId": "uuid-here",
  "model": "text-embedding-3-small",
  "dimensions": 1536,
  "tokens": 245,
  "processingTime": 1234,
  "cost": 0.0000049
}
```

#### 2. Batch Generate Embeddings

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/generate-batch-embeddings' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documentIds": ["uuid-1", "uuid-2", "uuid-3"],
    "model": "text-embedding-3-small",
    "forceRegenerate": false,
    "batchSize": 10
  }'
```

Response:
```json
{
  "success": true,
  "results": {
    "total": 3,
    "successful": 2,
    "failed": 0,
    "skipped": 1,
    "totalTokens": 500,
    "totalCost": 0.00001,
    "totalProcessingTime": 2500,
    "details": [...]
  }
}
```

## UI Components

### 1. EmbeddingStatus Component

Shows the embedding status for a document with ability to generate or regenerate:

```tsx
import { EmbeddingStatus } from '@/resources/documents'

<Datagrid>
  <TextField source="title" />
  <EmbeddingStatus label="Embedding" />
</Datagrid>
```

### 2. BatchEmbeddingButton Component

Enables batch embedding generation for selected documents:

```tsx
import { BatchEmbeddingButton } from '@/resources/documents'

<TopToolbar>
  <BatchEmbeddingButton />
</TopToolbar>
```

### 3. EmbeddingAnalytics Component

Dashboard for viewing embedding statistics and analytics:

```tsx
import { EmbeddingAnalytics } from '@/resources/documents/EmbeddingAnalytics'

<Route path="/embeddings/analytics" element={<EmbeddingAnalytics />} />
```

## Database Schema

### Documents Table

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  title TEXT NOT NULL,
  content TEXT,

  -- Embedding fields
  embedding VECTOR(1536),
  embedding_generated BOOLEAN DEFAULT FALSE,
  embedding_model TEXT,
  embedding_dimensions INTEGER,
  embedding_updated_at TIMESTAMP WITH TIME ZONE,
  embedding_hash TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Embedding Analytics Table

```sql
CREATE TABLE embedding_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  document_id UUID REFERENCES documents(id),

  embedding_model TEXT NOT NULL,
  embedding_dimensions INTEGER,
  token_count INTEGER,
  processing_time_ms INTEGER,

  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Cost Optimization

### 1. Choose the Right Model

- Use `text-embedding-3-small` for most use cases (best cost/performance ratio)
- Use `text-embedding-3-large` only when higher accuracy is critical
- Avoid `text-embedding-ada-002` unless needed for compatibility

### 2. Content Optimization

- Trim unnecessary whitespace and formatting
- Remove redundant content before embedding
- Use the `maxTokens` parameter to limit input size

### 3. Batch Processing

- Process multiple documents in batches during off-peak hours
- Use the `batchSize` parameter to control rate limiting
- Monitor and adjust based on API rate limits

### 4. Caching Strategy

- Store `embedding_hash` to detect content changes
- Skip regeneration if content hasn't changed
- Use `forceRegenerate: false` to respect existing embeddings

## Monitoring

### 1. View Analytics

Access the embedding analytics dashboard to monitor:
- Total embeddings generated
- Success/failure rates
- Average processing time
- Cost breakdown by model

### 2. Check Logs

View Edge Function logs in Supabase Dashboard:
```
Settings > Edge Functions > [function-name] > Logs
```

### 3. Query Analytics

```sql
-- Total embeddings by model
SELECT
  embedding_model,
  COUNT(*) as total,
  SUM(token_count) as total_tokens,
  AVG(processing_time_ms) as avg_time_ms
FROM embedding_analytics
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY embedding_model;

-- Failed embeddings
SELECT *
FROM embedding_analytics
WHERE success = false
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### Error: "OPENAI_API_KEY is not configured"

Make sure the API key is set in Edge Function secrets:
```bash
npx supabase secrets set OPENAI_API_KEY=sk-your-key
```

### Error: "Rate limit exceeded"

Reduce the batch size or add delays between requests:
```typescript
{
  batchSize: 5,  // Process 5 at a time
}
```

### Error: "Document has no content to embed"

Ensure documents have content before generating embeddings:
```sql
UPDATE documents
SET content = 'Your content here'
WHERE id = 'document-id';
```

### High Costs

- Switch to `text-embedding-3-small` model
- Reduce the number of documents being embedded
- Implement content length limits
- Review and optimize content before embedding

## Best Practices

1. **Model Selection**: Start with `text-embedding-3-small` and upgrade to `text-embedding-3-large` only if needed
2. **Content Preparation**: Clean and normalize content before embedding
3. **Batch Processing**: Use batch operations for multiple documents
4. **Error Handling**: Implement retry logic for failed embeddings
5. **Monitoring**: Regularly check analytics and costs
6. **Security**: Never expose API keys in frontend code in production

## Integration with Typesense

The embeddings can be used with Typesense for vector search:

```typescript
// 1. Generate embedding for search query
const queryEmbedding = await generateEmbedding(searchQuery)

// 2. Search with Typesense
const searchResults = await typesenseClient
  .collections('documents')
  .documents()
  .search({
    q: '*',
    vector_query: `embedding:(${queryEmbedding.embedding.join(',')})`,
    k: 10  // Return top 10 results
  })
```

## Future Enhancements

- [ ] Automatic embedding on document upload
- [ ] Background job queue for large batches
- [ ] Custom dimension support for text-embedding-3-* models
- [ ] A/B testing different embedding models
- [ ] Embedding quality metrics
- [ ] Cost alerts and budgets

## Support

For issues or questions:
- Check the [OpenAI API documentation](https://platform.openai.com/docs/guides/embeddings)
- Review [Supabase Edge Functions docs](https://supabase.com/docs/guides/functions)
- Open an issue in the project repository
