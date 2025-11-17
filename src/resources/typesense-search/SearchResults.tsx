import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Clock, Database, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'

interface SearchResultsProps {
  results: {
    results: any[]
    totalTime?: number
  }
}

export const SearchResults = ({ results }: SearchResultsProps) => {
  const [selectedDocument, setSelectedDocument] = useState<any>(null)

  if (!results || !results.results || results.results.length === 0) {
    return null
  }

  const totalFound = results.results.reduce(
    (sum, result) => sum + (result.found || 0),
    0
  )
  const totalSearchTime = results.results.reduce(
    (sum, result) => sum + (result.search_time_ms || 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card className="p-4">
        <h2 className="text-xl font-bold mb-4">Search Results Summary</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">
                {results.results.length}
              </div>
              <div className="text-sm text-gray-500">Collections Searched</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{totalFound}</div>
              <div className="text-sm text-gray-500">Total Results</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-purple-500" />
            <div>
              <div className="text-2xl font-bold">{totalSearchTime}ms</div>
              <div className="text-sm text-gray-500">Search Time</div>
            </div>
          </div>
          {results.totalTime && (
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{results.totalTime}ms</div>
                <div className="text-sm text-gray-500">Total Time</div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Results by Collection */}
      {results.results.map((result, index) => (
        <Card key={index} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold">
                {result.request_params?.collection_name || `Collection ${index + 1}`}
              </h3>
              <Badge variant="secondary">{result.found} results</Badge>
              <Badge variant="outline">{result.search_time_ms}ms</Badge>
            </div>
            {result.request_params && (
              <div className="text-sm text-gray-500">
                Query: "{result.request_params.q || '*'}"
                {result.request_params.filter_by && (
                  <span className="ml-2">
                    | Filter: {result.request_params.filter_by}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Facets */}
          {result.facet_counts && result.facet_counts.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <h4 className="font-semibold mb-2">Facets</h4>
              <div className="space-y-2">
                {result.facet_counts.map((facet: any, facetIdx: number) => (
                  <div key={facetIdx}>
                    <span className="font-medium text-sm">
                      {facet.field_name}:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {facet.counts.map((count: any, countIdx: number) => (
                        <Badge key={countIdx} variant="secondary">
                          {count.value} ({count.count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results Table */}
          {result.hits && result.hits.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Highlights</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.hits.map((hit: any, hitIdx: number) => (
                    <TableRow key={hitIdx}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold">
                            {hit.document.title ||
                              hit.document.name ||
                              hit.document.id ||
                              'Untitled'}
                          </div>
                          {hit.document.description && (
                            <div className="text-sm text-gray-600 line-clamp-2">
                              {hit.document.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            ID: {hit.document.id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {hit.text_match !== undefined
                            ? hit.text_match.toFixed(2)
                            : 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hit.highlights && hit.highlights.length > 0 ? (
                          <div className="space-y-1 max-w-md">
                            {hit.highlights.slice(0, 3).map((highlight: any, hlIdx: number) => (
                              <div
                                key={hlIdx}
                                className="text-sm"
                              >
                                <span className="font-medium text-xs text-gray-500">
                                  {highlight.field}:
                                </span>
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: highlight.snippet || highlight.value,
                                  }}
                                  className="mt-0.5"
                                />
                              </div>
                            ))}
                            {hit.highlights.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{hit.highlights.length - 3} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            No highlights
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDocument(hit.document)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No results found
            </div>
          )}

          {/* Search Stats */}
          {result.out_of && (
            <div className="mt-4 text-sm text-gray-500">
              Showing {result.hits?.length || 0} of {result.found} results (out
              of {result.out_of} total documents)
            </div>
          )}
        </Card>
      ))}

      {/* Document Details Dialog */}
      <Dialog
        open={!!selectedDocument}
        onOpenChange={() => setSelectedDocument(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription>
              Full document data from search result
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold">ID:</span>{' '}
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {selectedDocument.id}
                  </code>
                </div>
                {selectedDocument.title && (
                  <div>
                    <span className="font-semibold">Title:</span>{' '}
                    {selectedDocument.title}
                  </div>
                )}
                {selectedDocument.name && (
                  <div>
                    <span className="font-semibold">Name:</span>{' '}
                    {selectedDocument.name}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-2">All Fields:</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs">
                  {JSON.stringify(selectedDocument, null, 2)}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedDocument)
                  .filter(
                    ([key]) =>
                      !['id', 'title', 'name', 'description'].includes(key)
                  )
                  .map(([key, value]) => (
                    <div key={key} className="border-l-2 border-blue-500 pl-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase">
                        {key}
                      </div>
                      <div className="text-sm mt-1">
                        {typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
