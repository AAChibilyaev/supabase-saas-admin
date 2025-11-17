/**
 * Typesense Integration Tests
 *
 * These tests verify the complete Typesense integration including:
 * - Client initialization
 * - Collection management
 * - Document operations
 * - Search functionality
 * - Data provider operations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { typesenseClient, isTypesenseEnabled } from '../providers/typesenseClient'
import { typesenseDataProvider } from '../providers/typesenseDataProvider'

// Skip tests if Typesense is not configured
const describeIfEnabled = isTypesenseEnabled() ? describe : describe.skip

describeIfEnabled('Typesense Integration', () => {
  const testCollectionName = 'test-collection'
  const testDocumentId = 'test-doc-1'

  beforeAll(async () => {
    if (!typesenseClient) {
      throw new Error('Typesense client not initialized')
    }

    // Clean up any existing test collection
    try {
      await typesenseClient.collections(testCollectionName).delete()
    } catch (error) {
      // Collection might not exist, ignore error
    }
  })

  afterAll(async () => {
    // Clean up test collection
    try {
      if (typesenseClient) {
        await typesenseClient.collections(testCollectionName).delete()
      }
    } catch (error) {
      console.error('Failed to clean up test collection:', error)
    }
  })

  describe('Client Initialization', () => {
    it('should have a valid Typesense client', () => {
      expect(typesenseClient).toBeDefined()
      expect(typesenseClient).not.toBeNull()
    })

    it('should be enabled', () => {
      expect(isTypesenseEnabled()).toBe(true)
    })

    it('should connect to Typesense server', async () => {
      const health = await typesenseClient!.health.retrieve()
      expect(health.ok).toBe(true)
    })
  })

  describe('Collection Management', () => {
    it('should create a collection', async () => {
      const schema = {
        name: testCollectionName,
        fields: [
          { name: 'id', type: 'string' },
          { name: 'title', type: 'string' },
          { name: 'content', type: 'string' },
          { name: 'category', type: 'string', facet: true },
          { name: 'created_at', type: 'int64' },
        ],
        default_sorting_field: 'created_at',
      }

      const collection = await typesenseClient!.collections().create(schema)
      expect(collection.name).toBe(testCollectionName)
      expect(collection.fields).toHaveLength(5)
    })

    it('should retrieve a collection', async () => {
      const collection = await typesenseClient!.collections(testCollectionName).retrieve()
      expect(collection.name).toBe(testCollectionName)
    })

    it('should list all collections', async () => {
      const collections = await typesenseClient!.collections().retrieve()
      expect(Array.isArray(collections)).toBe(true)
      expect(collections.some((c: any) => c.name === testCollectionName)).toBe(true)
    })
  })

  describe('Document Operations', () => {
    it('should create a document', async () => {
      const document = {
        id: testDocumentId,
        title: 'Test Document',
        content: 'This is a test document for integration testing',
        category: 'test',
        created_at: Math.floor(Date.now() / 1000),
      }

      const created = await typesenseClient!
        .collections(testCollectionName)
        .documents()
        .create(document)

      expect(created.id).toBe(testDocumentId)
    })

    it('should retrieve a document', async () => {
      const document = await typesenseClient!
        .collections(testCollectionName)
        .documents(testDocumentId)
        .retrieve()

      expect(document.id).toBe(testDocumentId)
      expect(document.title).toBe('Test Document')
    })

    it('should update a document', async () => {
      const updated = await typesenseClient!
        .collections(testCollectionName)
        .documents(testDocumentId)
        .update({
          title: 'Updated Test Document',
        })

      expect(updated.title).toBe('Updated Test Document')
    })

    it('should upsert a document', async () => {
      const document = {
        id: 'test-doc-2',
        title: 'Upserted Document',
        content: 'This document was upserted',
        category: 'test',
        created_at: Math.floor(Date.now() / 1000),
      }

      const upserted = await typesenseClient!
        .collections(testCollectionName)
        .documents()
        .upsert(document)

      expect(upserted.id).toBe('test-doc-2')
    })

    it('should bulk import documents', async () => {
      const documents = [
        {
          id: 'bulk-1',
          title: 'Bulk Document 1',
          content: 'First bulk document',
          category: 'bulk',
          created_at: Math.floor(Date.now() / 1000),
        },
        {
          id: 'bulk-2',
          title: 'Bulk Document 2',
          content: 'Second bulk document',
          category: 'bulk',
          created_at: Math.floor(Date.now() / 1000),
        },
        {
          id: 'bulk-3',
          title: 'Bulk Document 3',
          content: 'Third bulk document',
          category: 'bulk',
          created_at: Math.floor(Date.now() / 1000),
        },
      ]

      const results = await typesenseClient!
        .collections(testCollectionName)
        .documents()
        .import(documents, { action: 'create', batch_size: 2 })

      const parsedResults = results
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line))

      expect(parsedResults).toHaveLength(3)
      expect(parsedResults.every((r) => r.success)).toBe(true)
    })
  })

  describe('Search Functionality', () => {
    it('should perform basic search', async () => {
      const searchResults = await typesenseClient!
        .collections(testCollectionName)
        .documents()
        .search({
          q: 'test',
          query_by: 'title,content',
        })

      expect(searchResults.found).toBeGreaterThan(0)
      expect(searchResults.hits).toBeDefined()
      expect(Array.isArray(searchResults.hits)).toBe(true)
    })

    it('should search with filters', async () => {
      const searchResults = await typesenseClient!
        .collections(testCollectionName)
        .documents()
        .search({
          q: '*',
          query_by: 'title',
          filter_by: 'category:bulk',
        })

      expect(searchResults.found).toBe(3)
      expect(searchResults.hits?.every((hit) => hit.document.category === 'bulk')).toBe(true)
    })

    it('should search with facets', async () => {
      const searchResults = await typesenseClient!
        .collections(testCollectionName)
        .documents()
        .search({
          q: '*',
          query_by: 'title',
          facet_by: 'category',
        })

      expect(searchResults.facet_counts).toBeDefined()
      expect(searchResults.facet_counts).toHaveLength(1)
      expect(searchResults.facet_counts![0].field_name).toBe('category')
    })

    it('should search with sorting', async () => {
      const searchResults = await typesenseClient!
        .collections(testCollectionName)
        .documents()
        .search({
          q: '*',
          query_by: 'title',
          sort_by: 'created_at:desc',
        })

      expect(searchResults.hits).toBeDefined()
      expect(searchResults.hits!.length).toBeGreaterThan(0)
    })

    it('should search with pagination', async () => {
      const searchResults = await typesenseClient!
        .collections(testCollectionName)
        .documents()
        .search({
          q: '*',
          query_by: 'title',
          per_page: 2,
          page: 1,
        })

      expect(searchResults.hits).toBeDefined()
      expect(searchResults.hits!.length).toBeLessThanOrEqual(2)
      expect(searchResults.page).toBe(1)
    })

    it('should handle typo tolerance', async () => {
      const searchResults = await typesenseClient!
        .collections(testCollectionName)
        .documents()
        .search({
          q: 'docuemnt', // Intentional typo
          query_by: 'title,content',
          num_typos: 2,
        })

      expect(searchResults.found).toBeGreaterThan(0)
    })
  })

  describe('Data Provider Integration', () => {
    it('should list collections via data provider', async () => {
      const result = await typesenseDataProvider.getList('typesense-collections', {
        pagination: { page: 1, perPage: 10 },
        sort: { field: 'name', order: 'ASC' },
        filter: {},
      })

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.total).toBeGreaterThan(0)
    })

    it('should get a collection via data provider', async () => {
      const result = await typesenseDataProvider.getOne('typesense-collections', {
        id: testCollectionName,
      })

      expect(result.data).toBeDefined()
      expect(result.data.id).toBe(testCollectionName)
    })

    it('should search documents via data provider', async () => {
      const result = await typesenseDataProvider.getList('typesense-documents', {
        pagination: { page: 1, perPage: 10 },
        sort: { field: 'created_at', order: 'DESC' },
        filter: {
          collection: testCollectionName,
          q: 'test',
          query_by: 'title,content',
        },
      })

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.total).toBeGreaterThan(0)
    })

    it('should create a document via data provider', async () => {
      const newDoc = {
        id: 'provider-test-1',
        title: 'Data Provider Test',
        content: 'Created via data provider',
        category: 'provider-test',
        collection: testCollectionName,
        created_at: Math.floor(Date.now() / 1000),
      }

      const result = await typesenseDataProvider.create('typesense-documents', {
        data: newDoc,
      })

      expect(result.data).toBeDefined()
      expect(result.data.id).toBe('provider-test-1')
    })

    it('should update a document via data provider', async () => {
      const result = await typesenseDataProvider.update('typesense-documents', {
        id: 'provider-test-1',
        data: {
          title: 'Updated via Provider',
          collection: testCollectionName,
        },
        previousData: {},
      })

      expect(result.data).toBeDefined()
      expect(result.data.title).toBe('Updated via Provider')
    })

    it('should delete a document via data provider', async () => {
      const result = await typesenseDataProvider.delete('typesense-documents', {
        id: 'provider-test-1',
        previousData: {
          collection: testCollectionName,
        },
      })

      expect(result.data).toBeDefined()
      expect(result.data.id).toBe('provider-test-1')
    })
  })

  describe('Cleanup', () => {
    it('should delete all test documents', async () => {
      // Delete using filter
      await typesenseClient!
        .collections(testCollectionName)
        .documents()
        .delete({
          filter_by: 'category:test || category:bulk || category:provider-test',
        })

      // Verify deletion
      const searchResults = await typesenseClient!
        .collections(testCollectionName)
        .documents()
        .search({
          q: '*',
          query_by: 'title',
        })

      // Should only have the original test document (if any)
      expect(searchResults.found).toBeLessThanOrEqual(2)
    })
  })
})

describeIfEnabled('Typesense Performance', () => {
  const perfCollectionName = 'perf-test-collection'

  beforeAll(async () => {
    if (!typesenseClient) return

    try {
      await typesenseClient.collections(perfCollectionName).delete()
    } catch (error) {
      // Ignore
    }

    // Create collection for performance testing
    await typesenseClient.collections().create({
      name: perfCollectionName,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'created_at', type: 'int64' },
      ],
      default_sorting_field: 'created_at',
    })
  })

  afterAll(async () => {
    if (!typesenseClient) return
    try {
      await typesenseClient.collections(perfCollectionName).delete()
    } catch (error) {
      console.error('Failed to clean up performance test collection:', error)
    }
  })

  it('should handle batch import efficiently', async () => {
    const documentsCount = 1000
    const documents = Array.from({ length: documentsCount }, (_, i) => ({
      id: `perf-${i}`,
      title: `Performance Test Document ${i}`,
      content: `This is document number ${i} for performance testing`,
      created_at: Math.floor(Date.now() / 1000) + i,
    }))

    const startTime = Date.now()

    const results = await typesenseClient!
      .collections(perfCollectionName)
      .documents()
      .import(documents, {
        action: 'create',
        batch_size: 100,
      })

    const endTime = Date.now()
    const duration = endTime - startTime

    const parsedResults = results
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line))

    expect(parsedResults).toHaveLength(documentsCount)
    expect(parsedResults.every((r) => r.success)).toBe(true)

    // Should complete in reasonable time (< 5 seconds for 1000 docs)
    expect(duration).toBeLessThan(5000)

    console.log(`Imported ${documentsCount} documents in ${duration}ms`)
    console.log(`Average: ${(duration / documentsCount).toFixed(2)}ms per document`)
  })

  it('should search large dataset efficiently', async () => {
    const startTime = Date.now()

    const searchResults = await typesenseClient!
      .collections(perfCollectionName)
      .documents()
      .search({
        q: 'performance',
        query_by: 'title,content',
        per_page: 100,
      })

    const endTime = Date.now()
    const duration = endTime - startTime

    expect(searchResults.found).toBeGreaterThan(0)
    expect(searchResults.hits).toBeDefined()

    // Search should be fast (< 100ms)
    expect(duration).toBeLessThan(100)

    console.log(`Search completed in ${duration}ms`)
    console.log(`Found ${searchResults.found} results`)
  })
})
