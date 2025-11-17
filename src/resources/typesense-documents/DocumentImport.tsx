import { useState, useRef } from 'react'
import { useNotify, useRedirect, SelectInput, Button as RAButton } from 'react-admin'
import { useSearchParams } from 'react-router-dom'
import { typesenseClient } from '../../providers/typesenseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Progress } from '../../components/ui/progress'
import { Upload, FileText, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import type { CollectionResponse } from '../../types/typesense'

interface ImportResult {
  success: boolean
  error?: string
  document?: any
}

export const DocumentImport = () => {
  const [searchParams] = useSearchParams()
  const [collections, setCollections] = useState<CollectionResponse[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>(
    searchParams.get('collection') || ''
  )
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{
    successful: number
    failed: number
    total: number
    errors: Array<{ line: number; error: string }>
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const notify = useNotify()
  const redirect = useRedirect()

  // Fetch collections on mount
  useState(() => {
    const fetchCollections = async () => {
      if (!typesenseClient) return

      try {
        const response = await typesenseClient.collections().retrieve()
        setCollections(response)
      } catch (error: any) {
        notify(`Failed to load collections: ${error.message}`, { type: 'error' })
      }
    }

    fetchCollections()
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.jsonl') && !selectedFile.name.endsWith('.json')) {
        notify('Please select a JSONL or JSON file', { type: 'error' })
        return
      }
      setFile(selectedFile)
      setResults(null) // Clear previous results
    }
  }

  const handleImport = async () => {
    if (!file || !selectedCollection) {
      notify('Please select both a collection and a file', { type: 'error' })
      return
    }

    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      return
    }

    setImporting(true)
    setProgress(0)
    setResults(null)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter((line) => line.trim())

      // Parse JSONL
      const documents: any[] = []
      const parseErrors: Array<{ line: number; error: string }> = []

      lines.forEach((line, index) => {
        try {
          const doc = JSON.parse(line)
          documents.push(doc)
        } catch (error: any) {
          parseErrors.push({
            line: index + 1,
            error: error.message,
          })
        }
      })

      if (parseErrors.length > 0) {
        notify(
          `Found ${parseErrors.length} parsing errors. Check the results for details.`,
          { type: 'warning' }
        )
      }

      if (documents.length === 0) {
        notify('No valid documents found in the file', { type: 'error' })
        setImporting(false)
        return
      }

      // Use bulk import - MUCH faster than individual creates
      const batchSize = 100
      let successful = 0
      let failed = 0
      const importErrors: Array<{ line: number; error: string }> = []

      // Process in batches
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize)

        try {
          const response = await typesenseClient
            .collections(selectedCollection)
            .documents()
            .import(batch, {
              action: 'upsert', // Upsert: create or update
              batch_size: batchSize,
              dirty_values: 'coerce_or_reject', // Try to coerce invalid values
            })

          // Parse import results (JSONL format)
          const resultLines = response.split('\n').filter((line) => line.trim())
          resultLines.forEach((resultLine, idx) => {
            try {
              const result = JSON.parse(resultLine) as ImportResult
              if (result.success) {
                successful++
              } else {
                failed++
                importErrors.push({
                  line: i + idx + 1,
                  error: result.error || 'Unknown error',
                })
              }
            } catch (error: any) {
              console.error('Failed to parse import result:', error)
            }
          })
        } catch (error: any) {
          // Batch failed entirely
          failed += batch.length
          importErrors.push({
            line: i + 1,
            error: `Batch import failed: ${error.message}`,
          })
        }

        // Update progress
        setProgress(Math.round(((i + batch.length) / documents.length) * 100))
      }

      // Combine parsing and import errors
      const allErrors = [...parseErrors, ...importErrors]

      setResults({
        successful,
        failed,
        total: documents.length,
        errors: allErrors,
      })

      if (failed === 0) {
        notify(`Successfully imported ${successful} documents`, { type: 'success' })
      } else {
        notify(
          `Import completed: ${successful} successful, ${failed} failed`,
          { type: failed > successful ? 'error' : 'warning' }
        )
      }
    } catch (error: any) {
      notify(`Import failed: ${error.message}`, { type: 'error' })
      console.error('Import error:', error)
    } finally {
      setImporting(false)
    }
  }

  const collectionChoices = collections.map((c) => ({
    id: c.name,
    name: `${c.name} (${c.num_documents || 0} docs)`,
  }))

  if (!typesenseClient) {
    return (
      <div className="p-8">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Typesense client is not configured. Please set up environment variables.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk Import Documents
          </CardTitle>
          <CardDescription>
            Import documents from a JSONL file. Uses Typesense's bulk import API for optimal
            performance (100x faster than single requests).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Collection Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Target Collection</label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={importing}
            >
              <option value="">Select a collection...</option>
              {collections.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.num_documents || 0} docs)
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">JSONL File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jsonl,.json"
              onChange={handleFileChange}
              className="hidden"
              disabled={importing}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={importing}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                {file ? file.name : 'Select JSONL file...'}
              </Button>
              {file && (
                <Badge variant="outline" className="py-2">
                  {(file.size / 1024).toFixed(2)} KB
                </Badge>
              )}
            </div>
          </div>

          {/* Import Instructions */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>JSONL Format</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                Each line must be a valid JSON object representing a document:
              </p>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
{`{"id":"1","title":"Product 1","price":29.99}
{"id":"2","title":"Product 2","price":49.99}
{"id":"3","title":"Product 3","price":19.99}`}
              </pre>
            </AlertDescription>
          </Alert>

          {/* Import Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing documents...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Import Results */}
          {results && (
            <Alert variant={results.failed === 0 ? 'default' : 'destructive'}>
              {results.failed === 0 ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>Import Results</AlertTitle>
              <AlertDescription>
                <div className="space-y-2 mt-2">
                  <div className="flex gap-4">
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {results.successful} successful
                    </Badge>
                    {results.failed > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {results.failed} failed
                      </Badge>
                    )}
                  </div>

                  {results.errors.length > 0 && (
                    <details className="mt-4">
                      <summary className="cursor-pointer font-semibold">
                        View Errors ({results.errors.length})
                      </summary>
                      <div className="mt-2 max-h-60 overflow-y-auto">
                        {results.errors.map((error, idx) => (
                          <div key={idx} className="text-xs py-1 border-b last:border-0">
                            <span className="font-mono">Line {error.line}:</span> {error.error}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-between">
            <Button
              variant="outline"
              onClick={() => redirect(`/typesense-documents?filter=${JSON.stringify({ collection: selectedCollection })}`)}
            >
              Back to Documents
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || !selectedCollection || importing}
            >
              {importing ? 'Importing...' : 'Import Documents'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
