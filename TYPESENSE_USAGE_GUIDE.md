# Typesense Admin Interface - Usage Guide

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Navigation](#navigation)
4. [Core Features](#core-features)
5. [Search Enhancement](#search-enhancement)
6. [Analytics & Monitoring](#analytics--monitoring)
7. [Security](#security)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Overview

The Typesense Admin Interface is fully integrated into the Supabase React Admin panel, providing comprehensive search engine management capabilities. All Typesense resources are accessible through an organized menu structure and integrated with the existing dashboard.

## Getting Started

### Prerequisites

- Typesense server running and accessible
- Environment variables configured:
  ```bash
  VITE_TYPESENSE_URL=https://your-typesense-server.com
  VITE_TYPESENSE_API_KEY=your-admin-api-key
  ```

### First Steps

1. **Check Typesense Status**
   - Navigate to the main Dashboard
   - Look for the "Typesense Status" widget
   - Verify it shows "Healthy" status
   - Review collection count and system metrics

2. **Explore the Menu**
   - The custom menu organizes all Typesense features
   - Resources are grouped logically:
     - Collections & Documents
     - Search Features
     - Search Enhancement
     - Advanced Features
     - Management
     - Analytics & Monitoring

## Navigation

### Menu Structure

The Typesense integration adds the following menu items:

#### Collections & Documents
- **Collections** (`/typesense-collections`) - Manage search collections
- **TS Documents** (`/typesense-documents`) - Manage documents within collections

#### Search Features
- **Multi-Search** (`/typesense-search`) - Execute searches across collections

#### Search Enhancement
- **Synonyms** (`/typesense-synonyms`) - Manage synonym sets
- **Curations** (`/typesense-curations`) - Curate search results
- **Stopwords** (`/typesense-stopwords`) - Define stopwords
- **Search Presets** (`/presets`) - Save search configurations
- **Stemming** (`/typesense-stemming`) - Language-specific stemming

#### Advanced Features
- **NL Models** (`/typesense-nl-models`) - Natural language search
- **RAG Models** (`/typesense-conversations`) - Conversational search

#### Management
- **Aliases** (`/typesense-aliases`) - Collection aliases
- **TS API Keys** (`/typesense-keys`) - API key management

#### Analytics & Monitoring
- **Analytics** (`/typesense-analytics`) - Search analytics dashboard
- **System Status** (`/typesense-system-dashboard`) - System health
- **Metrics** (`/typesense-system-metrics`) - Performance metrics

## Core Features

### Collections Management

Collections are the foundation of Typesense. They define the schema for your searchable data.

#### Creating a Collection

1. Navigate to **Collections** (`/typesense-collections`)
2. Click the **Create** button
3. Fill in the collection details:
   - **Name**: Unique collection identifier
   - **Fields**: Array of field definitions

Example schema:
```json
{
  "name": "products",
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
      "name": "description",
      "type": "string"
    },
    {
      "name": "price",
      "type": "float"
    },
    {
      "name": "category",
      "type": "string",
      "facet": true
    },
    {
      "name": "in_stock",
      "type": "bool"
    },
    {
      "name": "created_at",
      "type": "int64"
    }
  ],
  "default_sorting_field": "created_at"
}
```

4. Click **Save**

#### Viewing Collection Details

1. Click on any collection in the list
2. View:
   - Schema definition
   - Number of documents
   - Field configurations
   - Statistics

#### Editing Collections

1. Navigate to the collection
2. Click **Edit**
3. Modify settings (limited to certain fields)
4. Save changes

#### Deleting Collections

1. Select collection
2. Click **Delete**
3. Confirm deletion (this is permanent!)

### Documents Management

Documents are the individual records within a collection.

#### Adding Documents

1. Navigate to **TS Documents** (`/typesense-documents`)
2. Select the target collection
3. Click **Create**
4. Enter document data (JSON format):

```json
{
  "id": "product-001",
  "title": "Premium Laptop",
  "description": "High-performance laptop for professionals",
  "price": 1299.99,
  "category": "Electronics",
  "in_stock": true,
  "created_at": 1699564800
}
```

5. Click **Save**

#### Bulk Import

For importing multiple documents:

1. Prepare a JSONL file (one JSON object per line)
2. Navigate to collection
3. Use the import functionality
4. Select file
5. Monitor import progress

#### Editing Documents

1. Find the document in the list
2. Click to view details
3. Click **Edit**
4. Modify fields
5. Save changes

#### Deleting Documents

1. Select document(s)
2. Click **Delete**
3. Confirm deletion

### Multi-Search

Execute searches across one or multiple collections.

1. Navigate to **Multi-Search** (`/typesense-search`)
2. Configure search parameters:
   - **Query**: Search text
   - **Collections**: Select collections to search
   - **Query By**: Fields to search in
   - **Filter By**: Additional filters
   - **Sort By**: Result ordering
3. Click **Search**
4. View results with:
   - Matching documents
   - Highlighting
   - Facets
   - Search time

## Search Enhancement

### Synonyms

Improve search relevance by defining synonyms.

#### Creating Synonym Sets

1. Navigate to **Synonyms** (`/typesense-synonyms`)
2. Click **Create**
3. Define synonym set:

```json
{
  "id": "laptop-synonyms",
  "synonyms": ["laptop", "notebook", "portable computer", "laptop computer"]
}
```

4. Save

**Types of Synonyms:**
- **Multi-way**: All terms are interchangeable (default)
- **One-way**: Use `root => synonym1, synonym2` format

#### Use Cases

- Product variations: "phone", "mobile", "smartphone"
- Brand names: "Coke", "Coca-Cola"
- Spelling variations: "color", "colour"
- Abbreviations: "CPU", "processor"

### Curations

Control search results for specific queries.

#### Creating Curation Sets

1. Navigate to **Curations** (`/typesense-curations`)
2. Click **Create**
3. Configure:
   - **Query**: The search query to curate
   - **Includes**: Documents to always include
   - **Excludes**: Documents to never show
   - **Positions**: Pin documents to specific positions

Example:
```json
{
  "rule": {
    "query": "best laptop",
    "match": "exact"
  },
  "includes": [
    {"id": "product-001", "position": 1},
    {"id": "product-042", "position": 2}
  ],
  "excludes": [
    {"id": "product-999"}
  ]
}
```

4. Save

#### Use Cases

- Promote specific products
- Handle misspellings
- Business rules enforcement
- Seasonal promotions

### Stopwords

Define words to ignore during search.

1. Navigate to **Stopwords** (`/typesense-stopwords`)
2. Click **Create**
3. Enter stopwords set:

```json
{
  "id": "english-stopwords",
  "stopwords": ["the", "is", "at", "which", "on", "a", "an"]
}
```

4. Save

### Search Presets

Save frequently used search configurations.

1. Navigate to **Search Presets** (`/presets`)
2. Click **Create**
3. Define preset:
   - Name and description
   - Default query parameters
   - Filters
   - Sort order
4. Save

Use presets to quickly execute common searches.

### Stemming Dictionaries

Configure language-specific word stemming.

1. Navigate to **Stemming** (`/typesense-stemming`)
2. Import or create stemming rules
3. Select language
4. Configure custom rules if needed

## Advanced Features

### Natural Language Models

Configure NL search for better query understanding.

1. Navigate to **NL Models** (`/typesense-nl-models`)
2. Create or configure models
3. Set model parameters
4. Test with sample queries

### Conversation Models (RAG)

Set up conversational search with RAG capabilities.

1. Navigate to **RAG Models** (`/typesense-conversations`)
2. Configure conversation model
3. Set up context and history
4. Test conversational queries

### Collection Aliases

Create aliases for collections (useful for zero-downtime updates).

#### Creating an Alias

1. Navigate to **Aliases** (`/typesense-aliases`)
2. Click **Create**
3. Enter:
   - **Alias Name**: The alias to create
   - **Collection Name**: Target collection
4. Save

#### Zero-Downtime Migration

1. Create new collection with updated schema
2. Import data to new collection
3. Test thoroughly
4. Update alias to point to new collection
5. Delete old collection when safe

## Analytics & Monitoring

### Dashboard Widget

The main dashboard includes a Typesense Health Widget showing:
- Overall health status (Healthy/Unhealthy)
- Number of collections
- Memory usage
- System uptime
- Typesense version
- Individual node health
- Response times

The widget auto-refreshes every 30 seconds.

### Analytics Dashboard

1. Navigate to **Analytics** (`/typesense-analytics`)
2. View metrics:
   - Search volume over time
   - Popular queries
   - No-result queries
   - Click-through rates
   - Query performance
3. Filter by date range
4. Export data for analysis

### System Status

1. Navigate to **System Status** (`/typesense-system-dashboard`)
2. Review:
   - Cluster health
   - Node status
   - Collection statistics
   - Resource usage overview

### System Metrics

1. Navigate to **Metrics** (`/typesense-system-metrics`)
2. View detailed metrics:
   - Search latency (p50, p95, p99)
   - Indexing performance
   - Memory usage trends
   - CPU utilization
   - Network I/O
   - Request rates
   - Error rates

## Security

### API Keys Management

Generate and manage API keys with granular permissions.

#### Creating an API Key

1. Navigate to **TS API Keys** (`/typesense-keys`)
2. Click **Create**
3. Configure key:
   - **Description**: Purpose of the key
   - **Actions**: Allowed operations (search, create, update, delete)
   - **Collections**: Specific collections (or * for all)
   - **Expiration**: Optional expiration date

Example configuration:
```json
{
  "description": "Search-only key for frontend",
  "actions": ["documents:search"],
  "collections": ["products", "articles"],
  "expires_at": 1735689600
}
```

4. Click **Save**
5. **IMPORTANT**: Copy the generated key immediately (shown only once!)

#### Key Types

- **Admin Keys**: Full access (keep secure!)
- **Search Keys**: Read-only search access
- **Scoped Keys**: Limited to specific collections
- **Time-limited Keys**: Automatically expire

#### Best Practices

- Use search-only keys for frontend applications
- Set expiration dates on keys
- Rotate keys regularly
- Never expose admin keys in client code
- Scope keys to minimum required collections

## Best Practices

### Collection Design

1. **Field Types**: Choose appropriate types for your data
2. **Faceting**: Mark fields for faceting that you'll filter by
3. **Sorting**: Define a default sorting field
4. **Optional Fields**: Mark optional fields appropriately
5. **Indexing**: Only index fields you'll search on

### Search Optimization

1. **Query By**: Specify fields to search (don't use wildcard *)
2. **Typo Tolerance**: Configure num_typos appropriately
3. **Prefix Search**: Enable for autocomplete functionality
4. **Filters**: Use filter_by for exact matches
5. **Facets**: Request only needed facets

### Performance

1. **Batch Operations**: Use bulk import for multiple documents
2. **Caching**: Enable caching for frequently accessed data
3. **Field Selection**: Use include_fields/exclude_fields
4. **Pagination**: Limit results per page
5. **Monitoring**: Regular check system metrics

### Maintenance

1. **Regular Backups**: Export collections regularly
2. **Monitor Health**: Check dashboard widget daily
3. **Review Analytics**: Identify optimization opportunities
4. **Update Synonyms**: Keep synonyms current
5. **Clean Old Data**: Remove outdated documents

## Troubleshooting

### Common Issues

#### Issue: "Typesense is not configured"

**Symptoms**: Dashboard widget shows configuration error

**Solutions**:
1. Check environment variables are set:
   ```bash
   VITE_TYPESENSE_URL=https://your-server.com
   VITE_TYPESENSE_API_KEY=your-key
   ```
2. Restart development server
3. Verify .env file is in project root
4. Check variable names are correct (VITE_ prefix required)

#### Issue: "All nodes are unhealthy"

**Symptoms**: Health widget shows all nodes red

**Solutions**:
1. Verify Typesense server is running
2. Check network connectivity
3. Test URL in browser: `https://your-server.com/health`
4. Verify API key is correct
5. Check firewall settings
6. Review CORS configuration

#### Issue: "Collection not found"

**Symptoms**: Error when accessing collection

**Solutions**:
1. Verify collection exists (check Collections list)
2. Check spelling of collection name
3. Verify API key has access to collection
4. Refresh the page

#### Issue: "Search returns no results"

**Symptoms**: Valid queries return empty results

**Solutions**:
1. Verify collection has documents
2. Check query_by fields exist
3. Reduce typo_tokens_threshold
4. Try wildcard query (*)
5. Check filters aren't too restrictive
6. Review synonym configuration

#### Issue: "Slow search performance"

**Symptoms**: Searches take too long

**Solutions**:
1. Check System Metrics for resource usage
2. Limit fields in query_by
3. Reduce per_page
4. Add filters to narrow results
5. Optimize collection schema
6. Consider upgrading server resources

#### Issue: "Import fails"

**Symptoms**: Bulk import doesn't complete

**Solutions**:
1. Verify JSONL format (one JSON per line)
2. Check all required fields are present
3. Validate field types match schema
4. Review import logs for specific errors
5. Try smaller batches
6. Check server disk space

### Debug Mode

Enable detailed logging:

1. Navigate to browser console
2. Set localStorage debug flag:
   ```javascript
   localStorage.setItem('debug', 'typesense:*')
   ```
3. Refresh page
4. Review console for detailed logs

### Getting Help

If issues persist:

1. Check system logs in **System Logs** page
2. Review Typesense server logs
3. Check GitHub issues for similar problems
4. Consult Typesense documentation
5. Contact support with:
   - Error messages
   - System metrics
   - Collection configuration
   - Search query details

## Additional Resources

### Documentation

- **Typesense API Docs**: https://typesense.org/docs/api/
- **React Admin Docs**: https://marmelab.com/react-admin/
- **OpenAPI Spec**: https://raw.githubusercontent.com/typesense/typesense-api-spec/master/openapi.yml

### Related GitHub Issues

- #6: Parent issue for Typesense integration
- #7: Setup & Configuration
- #8: Collections Management
- #9: Documents Management
- #10: Multi-Search Interface
- #11: API Keys Management
- #12-15: Search Enhancement (Synonyms, Curations, Stopwords, Presets)
- #16: Collection Aliases
- #17: Analytics Dashboard
- #18: System Operations & Monitoring
- #19-21: Advanced Features (NL Models, RAG, Stemming)

### Tips & Tricks

1. **Quick Search**: Use browser's find (Ctrl/Cmd+F) in list views
2. **Keyboard Shortcuts**: Standard React Admin shortcuts work
3. **Bulk Actions**: Select multiple items for batch operations
4. **Export Data**: Use export features for backups
5. **Bookmarks**: Bookmark frequently used pages
6. **Filters**: Save filter presets for quick access

---

This guide covers the main features of the Typesense Admin Interface integration. For specific API details, refer to the Typesense documentation. For implementation details, see the TYPESENSE_INTEGRATION.md file.
