import { typesenseClient } from '../providers/typesenseClient'
import type { TypesenseDocument } from '../providers/typesenseClient'

/**
 * Result of a bulk import operation
 */
export interface BulkImportResult {
  success: boolean
  imported: number
  failed: number
  errors: Array<{
    document: any
    error: string
    line?: number
  }>
  duration: number
}

/**
 * Progress callback for bulk operations
 */
export type ProgressCallback = (progress: {
  current: number
  total: number
  percentage: number
}) => void

/**
 * Options for bulk import
 */
export interface BulkImportOptions {
  action?: 'create' | 'upsert' | 'update'
  batchSize?: number
  onProgress?: ProgressCallback
  returnFailedDocs?: boolean
}

/**
 * CRITICAL: Use import() API for bulk operations (100x faster than loops!)
 *
 * Bulk import documents into a Typesense collection using the fast import() API
 * Converts array of documents to JSONL format and uses Typesense's optimized bulk import
 *
 * @param collectionName - Name of the Typesense collection
 * @param documents - Array of documents to import
 * @param options - Import options
 * @returns Result of the import operation with statistics
 */
export const bulkImportDocuments = async (
  collectionName: string,
  documents: TypesenseDocument[],
  options: BulkImportOptions = {}
): Promise<BulkImportResult> => {
  const startTime = Date.now()
  const {
    action = 'upsert',
    batchSize = 1000,
    onProgress,
    returnFailedDocs = true,
  } = options

  if (!typesenseClient) {
    throw new Error('Typesense client is not initialized')
  }

  if (!documents || documents.length === 0) {
    return {
      success: true,
      imported: 0,
      failed: 0,
      errors: [],
      duration: 0,
    }
  }

  const result: BulkImportResult = {
    success: true,
    imported: 0,
    failed: 0,
    errors: [],
    duration: 0,
  }

  try {
    // Process documents in batches for better memory management with large datasets
    const totalBatches = Math.ceil(documents.length / batchSize)

    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize
      const end = Math.min(start + batchSize, documents.length)
      const batch = documents.slice(start, end)

      //  CORRECT: Convert to JSONL format (one JSON object per line)
      // This is the format expected by Typesense's import() API
      const importStr = batch.map((doc) => JSON.stringify(doc)).join('\n')

      try {
        // Use the fast import() API - 100x faster than looping with create()
        const importResult = await typesenseClient
          .collections(collectionName)
          .documents()
          .import(importStr, {
            action: action,
            return_doc: returnFailedDocs,
          })

        // Parse the import result (also in JSONL format)
        const importLines = importResult.split('\n').filter((line) => line.trim())

        for (let j = 0; j < importLines.length; j++) {
          try {
            const lineResult = JSON.parse(importLines[j])

            if (lineResult.success === true) {
              result.imported++
            } else {
              result.failed++
              result.errors.push({
                document: returnFailedDocs ? batch[j] : { index: start + j },
                error: lineResult.error || 'Unknown error',
                line: start + j + 1,
              })
            }
          } catch (parseError) {
            console.error('Failed to parse import result line:', importLines[j], parseError)
            result.failed++
            result.errors.push({
              document: returnFailedDocs ? batch[j] : { index: start + j },
              error: 'Failed to parse import result',
              line: start + j + 1,
            })
          }
        }

        // Report progress
        if (onProgress) {
          const current = end
          const total = documents.length
          const percentage = Math.round((current / total) * 100)
          onProgress({ current, total, percentage })
        }
      } catch (batchError: any) {
        console.error(`Batch ${i + 1}/${totalBatches} failed:`, batchError)

        // Mark all documents in this batch as failed
        result.failed += batch.length
        result.errors.push({
          document: { batchIndex: i, batchSize: batch.length },
          error: batchError.message || 'Batch import failed',
          line: start + 1,
        })
      }
    }

    result.success = result.failed === 0
    result.duration = Date.now() - startTime

    console.info(`Bulk import completed in ${result.duration}ms`, {
      collection: collectionName,
      imported: result.imported,
      failed: result.failed,
      total: documents.length,
    })

    return result
  } catch (error: any) {
    console.error('Bulk import failed:', error)
    throw new Error(`Bulk import failed: ${error.message}`)
  }
}

/**
 * Export documents from a Typesense collection to JSONL format
 *
 * @param collectionName - Name of the Typesense collection
 * @param options - Export options
 * @returns JSONL string of all documents
 */
export interface BulkExportOptions {
  filter_by?: string
  include_fields?: string
  exclude_fields?: string
  onProgress?: ProgressCallback
  perPage?: number
}

export const bulkExportDocuments = async (
  collectionName: string,
  options: BulkExportOptions = {}
): Promise<string> => {
  if (!typesenseClient) {
    throw new Error('Typesense client is not initialized')
  }

  const { filter_by, include_fields, exclude_fields, onProgress, perPage = 250 } = options

  const allDocuments: TypesenseDocument[] = []
  let page = 1
  let hasMore = true

  try {
    while (hasMore) {
      // Use export() API for efficient data retrieval
      const searchParams: any = {
        q: '*',
        query_by: '', // Not needed for wildcard search
        per_page: perPage,
        page: page,
      }

      if (filter_by) searchParams.filter_by = filter_by
      if (include_fields) searchParams.include_fields = include_fields
      if (exclude_fields) searchParams.exclude_fields = exclude_fields

      const result = await typesenseClient
        .collections(collectionName)
        .documents()
        .search(searchParams)

      const documents = result.hits?.map((hit: any) => hit.document) || []
      allDocuments.push(...documents)

      // Report progress
      if (onProgress) {
        onProgress({
          current: allDocuments.length,
          total: result.found || allDocuments.length,
          percentage: result.found
            ? Math.round((allDocuments.length / result.found) * 100)
            : 100,
        })
      }

      // Check if there are more pages
      hasMore = documents.length === perPage && allDocuments.length < (result.found || 0)
      page++
    }

    // Convert to JSONL format
    const jsonl = allDocuments.map((doc) => JSON.stringify(doc)).join('\n')

    console.info(`Exported ${allDocuments.length} documents from ${collectionName}`)

    return jsonl
  } catch (error: any) {
    console.error('Bulk export failed:', error)
    throw new Error(`Bulk export failed: ${error.message}`)
  }
}

/**
 * Parse JSONL file content into documents array
 *
 * @param jsonlContent - JSONL file content (one JSON object per line)
 * @returns Array of parsed documents
 */
export const parseJSONL = (jsonlContent: string): TypesenseDocument[] => {
  const lines = jsonlContent.split('\n').filter((line) => line.trim())
  const documents: TypesenseDocument[] = []
  const errors: Array<{ line: number; error: string }> = []

  for (let i = 0; i < lines.length; i++) {
    try {
      const doc = JSON.parse(lines[i])
      documents.push(doc)
    } catch (error: any) {
      console.error(`Failed to parse line ${i + 1}:`, lines[i], error)
      errors.push({
        line: i + 1,
        error: error.message || 'Invalid JSON',
      })
    }
  }

  if (errors.length > 0) {
    console.warn(`Failed to parse ${errors.length} lines:`, errors)
  }

  return documents
}

/**
 * Validate documents against collection schema
 *
 * @param documents - Documents to validate
 * @param schema - Collection schema
 * @returns Validation result with errors
 */
export interface ValidationResult {
  valid: boolean
  errors: Array<{
    document: any
    field: string
    error: string
  }>
}

export const validateDocuments = async (
  collectionName: string,
  documents: TypesenseDocument[]
): Promise<ValidationResult> => {
  if (!typesenseClient) {
    throw new Error('Typesense client is not initialized')
  }

  const result: ValidationResult = {
    valid: true,
    errors: [],
  }

  try {
    // Get collection schema
    const collection = await typesenseClient.collections(collectionName).retrieve()
    const schemaFields = collection.fields || []

    // Create a map of required fields
    const requiredFields = new Set(
      schemaFields.filter((f: any) => !f.optional).map((f: any) => f.name)
    )

    // Validate each document
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i]

      // Check required fields
      for (const fieldName of requiredFields) {
        if (!(fieldName in doc) || doc[fieldName] === null || doc[fieldName] === undefined) {
          result.valid = false
          result.errors.push({
            document: doc,
            field: fieldName,
            error: `Required field '${fieldName}' is missing`,
          })
        }
      }

      // Validate field types (basic validation)
      for (const field of schemaFields) {
        if (field.name in doc && doc[field.name] !== null) {
          const value = doc[field.name]
          const fieldType = field.type

          // Type validation
          if (fieldType === 'string' && typeof value !== 'string') {
            result.valid = false
            result.errors.push({
              document: doc,
              field: field.name,
              error: `Field '${field.name}' must be a string`,
            })
          } else if (fieldType === 'int32' || fieldType === 'int64') {
            if (typeof value !== 'number' || !Number.isInteger(value)) {
              result.valid = false
              result.errors.push({
                document: doc,
                field: field.name,
                error: `Field '${field.name}' must be an integer`,
              })
            }
          } else if (fieldType === 'float') {
            if (typeof value !== 'number') {
              result.valid = false
              result.errors.push({
                document: doc,
                field: field.name,
                error: `Field '${field.name}' must be a number`,
              })
            }
          } else if (fieldType === 'bool') {
            if (typeof value !== 'boolean') {
              result.valid = false
              result.errors.push({
                document: doc,
                field: field.name,
                error: `Field '${field.name}' must be a boolean`,
              })
            }
          } else if (fieldType.endsWith('[]')) {
            if (!Array.isArray(value)) {
              result.valid = false
              result.errors.push({
                document: doc,
                field: field.name,
                error: `Field '${field.name}' must be an array`,
              })
            }
          }
        }
      }
    }

    return result
  } catch (error: any) {
    console.error('Validation failed:', error)
    throw new Error(`Validation failed: ${error.message}`)
  }
}

/**
 * Download JSONL content as a file
 *
 * @param jsonlContent - JSONL content to download
 * @param filename - Name of the file to download
 */
export const downloadJSONL = (jsonlContent: string, filename: string): void => {
  const blob = new Blob([jsonlContent], { type: 'application/x-ndjson' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}

/**
 * Convert JSONL to CSV format
 *
 * @param jsonlContent - JSONL content
 * @returns CSV string
 */
export const jsonlToCSV = (jsonlContent: string): string => {
  const documents = parseJSONL(jsonlContent)

  if (documents.length === 0) {
    return ''
  }

  // Get all unique keys from all documents
  const allKeys = new Set<string>()
  documents.forEach((doc) => {
    Object.keys(doc).forEach((key) => allKeys.add(key))
  })

  const headers = Array.from(allKeys)
  const csvRows: string[] = []

  // Add header row
  csvRows.push(headers.map((h) => `"${h}"`).join(','))

  // Add data rows
  documents.forEach((doc) => {
    const row = headers.map((header) => {
      const value = doc[header]

      if (value === null || value === undefined) {
        return '""'
      }

      // Handle arrays and objects
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`
      }

      // Escape quotes in strings
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`
      }

      return `"${value}"`
    })

    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

/**
 * Download CSV content as a file
 *
 * @param csvContent - CSV content to download
 * @param filename - Name of the file to download
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}
