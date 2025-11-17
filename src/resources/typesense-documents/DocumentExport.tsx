import { useState } from 'react'
import { useNotify, useRedirect } from 'react-admin'
import { useSearchParams } from 'react-router-dom'
import { typesenseClient } from '../../providers/typesenseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Progress } from '../../components/ui/progress'
import { Download, FileText, Info, CheckCircle } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import type { CollectionResponse } from '../../types/typesense'

export const DocumentExport = () => {
  const [searchParams] = useSearchParams()
  const [collections, setCollections] = useState<CollectionResponse[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>(
    searchParams.get('collection') || ''
  )
  const [exporting, setExporting] = useState(false)
  const [exportCount, setExportCount] = useState<number | null>(null)
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

  const handleExport = async () => {
    if (!selectedCollection) {
      notify('Please select a collection', { type: 'error' })
      return
    }

    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      return
    }

    setExporting(true)
    setExportCount(null)

    try {
      // Export all documents from the collection
      const documents = await typesenseClient
        .collections(selectedCollection)
        .documents()
        .export()

      // Parse JSONL response
      const lines = documents.split('\n').filter((line) => line.trim())
      const count = lines.length

      if (count === 0) {
        notify('No documents found in this collection', { type: 'warning' })
        setExporting(false)
        return
      }

      // Create JSONL blob
      const jsonl = lines.join('\n')
      const blob = new Blob([jsonl], { type: 'application/jsonl' })
      const url = URL.createObjectURL(blob)

      // Download file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `${selectedCollection}-export-${timestamp}.jsonl`

      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportCount(count)
      notify(`Successfully exported ${count} documents to ${filename}`, { type: 'success' })
    } catch (error: any) {
      notify(`Export failed: ${error.message}`, { type: 'error' })
      console.error('Export error:', error)
    } finally {
      setExporting(false)
    }
  }

  const collectionChoices = collections.map((c) => ({
    id: c.name,
    name: `${c.name} (${c.num_documents || 0} docs)`,
  }))

  const selectedCollectionData = collections.find((c) => c.name === selectedCollection)

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
            <Download className="w-5 h-5" />
            Export Documents
          </CardTitle>
          <CardDescription>
            Export all documents from a collection to a JSONL file. This file can be used for
            backup or importing into another Typesense instance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Collection Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Collection to Export</label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={exporting}
            >
              <option value="">Select a collection...</option>
              {collections.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.num_documents || 0} documents)
                </option>
              ))}
            </select>
          </div>

          {/* Collection Info */}
          {selectedCollectionData && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Collection Information</AlertTitle>
              <AlertDescription>
                <div className="space-y-1 mt-2">
                  <div className="flex gap-4">
                    <Badge variant="outline">
                      {selectedCollectionData.num_documents || 0} documents
                    </Badge>
                    <Badge variant="outline">
                      {selectedCollectionData.fields.length} fields
                    </Badge>
                  </div>
                  {selectedCollectionData.default_sorting_field && (
                    <p className="text-sm">
                      Default sorting: <code>{selectedCollectionData.default_sorting_field}</code>
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Export Format Info */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertTitle>JSONL Format</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                Documents will be exported in JSONL format (one JSON object per line):
              </p>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
{`{"id":"1","title":"Product 1","price":29.99}
{"id":"2","title":"Product 2","price":49.99}
{"id":"3","title":"Product 3","price":19.99}`}
              </pre>
              <p className="mt-2 text-sm">
                This format is compatible with Typesense's bulk import API and can be easily
                processed by other tools.
              </p>
            </AlertDescription>
          </Alert>

          {/* Export Progress */}
          {exporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Exporting documents...</span>
              </div>
              <Progress value={50} className="animate-pulse" />
            </div>
          )}

          {/* Export Success */}
          {exportCount !== null && !exporting && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Export Successful</AlertTitle>
              <AlertDescription>
                <div className="mt-2">
                  <Badge variant="default" className="flex items-center gap-1 w-fit">
                    <FileText className="w-3 h-3" />
                    {exportCount} documents exported
                  </Badge>
                  <p className="text-sm mt-2">
                    The file has been downloaded to your browser's default download location.
                  </p>
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
              onClick={handleExport}
              disabled={!selectedCollection || exporting}
            >
              {exporting ? (
                <>
                  <Download className="w-4 h-4 mr-2 animate-bounce" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export to JSONL
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
