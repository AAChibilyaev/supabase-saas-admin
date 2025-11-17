import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotify, Button as RAButton } from 'react-admin'
import { Badge } from '../../components/ui/badge'
import { Target, Plus } from 'lucide-react'
import { typesenseClient } from '../../providers/typesenseClient'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Label } from '../../components/ui/label'

interface CurationOverride {
  id: string
  rule: {
    query: string
    match: string
  }
  includes?: Array<{ id: string; position: number }>
  excludes?: Array<{ id: string }>
  filter_by?: string
  filter_curated_hits?: boolean
  remove_matched_tokens?: boolean
  effective_from_ts?: number
  effective_to_ts?: number
}

interface CollectionResponse {
  name: string
  num_documents: number
}

const CurationSetList = () => {
  const [collections, setCollections] = useState<CollectionResponse[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [curations, setCurations] = useState<CurationOverride[]>([])
  const [loading, setLoading] = useState(true)
  const notify = useNotify()
  const navigate = useNavigate()

  useEffect(() => {
    loadCollections()
  }, [])

  useEffect(() => {
    if (selectedCollection) {
      loadCurations(selectedCollection)
    } else {
      setCurations([])
    }
  }, [selectedCollection])

  const loadCollections = async () => {
    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await typesenseClient.collections().retrieve()
      setCollections(response)

      // Auto-select first collection if available
      if (response.length > 0 && !selectedCollection) {
        setSelectedCollection(response[0].name)
      }
    } catch (error: any) {
      notify(`Failed to load collections: ${error.message}`, { type: 'error' })
      console.error('Error loading collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCurations = async (collection: string) => {
    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      return
    }

    try {
      setLoading(true)
      const response = await (typesenseClient as any)
        .collections(collection)
        .overrides()
        .retrieve()

      const overrides = response.overrides || []
      setCurations(
        overrides.map((override: any) => ({
          ...override,
          id: override.id || override.rule?.query || 'unknown'
        }))
      )
    } catch (error: any) {
      notify(`Failed to load curations: ${error.message}`, { type: 'error' })
      console.error('Error loading curations:', error)
      setCurations([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (curationId: string) => {
    if (!typesenseClient || !selectedCollection) {
      notify('Typesense client not configured or no collection selected', { type: 'error' })
      return
    }

    if (!window.confirm(`Are you sure you want to delete this curation rule?`)) {
      return
    }

    try {
      await (typesenseClient as any)
        .collections(selectedCollection)
        .overrides(curationId)
        .delete()

      notify('Curation deleted successfully', { type: 'success' })
      loadCurations(selectedCollection)
    } catch (error: any) {
      notify(`Failed to delete curation: ${error.message}`, { type: 'error' })
      console.error('Error deleting curation:', error)
    }
  }

  const handleEdit = (curationId: string) => {
    navigate(`/typesense-curations/${selectedCollection}:${curationId}`)
  }

  const handleCreate = () => {
    if (!selectedCollection) {
      notify('Please select a collection first', { type: 'warning' })
      return
    }
    navigate(`/typesense-curations/create?collection=${selectedCollection}`)
  }

  if (!typesenseClient) {
    return (
      <div className="p-8 text-center">
        <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">Typesense Not Configured</h2>
        <p className="text-gray-600">
          Please configure Typesense environment variables to use this feature.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Curation Sets</h1>
          <p className="text-gray-600 mt-1">
            Customize search results with pinned, included, or excluded documents
          </p>
        </div>
        <RAButton
          label="Create Curation"
          onClick={handleCreate}
          disabled={!selectedCollection}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Curation
        </RAButton>
      </div>

      <div className="mb-6">
        <Label htmlFor="collection" className="mb-2 block">
          Select Collection
        </Label>
        <Select value={selectedCollection} onValueChange={setSelectedCollection}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Choose a collection" />
          </SelectTrigger>
          <SelectContent>
            {collections.map((collection) => (
              <SelectItem key={collection.name} value={collection.name}>
                {collection.name} ({collection.num_documents} documents)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <p>Loading curations...</p>
        </div>
      ) : !selectedCollection ? (
        <div className="text-center py-12 border rounded-lg">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Collection Selected</h3>
          <p className="text-gray-600">
            Select a collection above to view and manage curation rules.
          </p>
        </div>
      ) : curations.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Curation Rules</h3>
          <p className="text-gray-600 mb-4">
            Create your first curation rule to customize search results.
          </p>
          <RAButton label="Create Curation" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Curation
          </RAButton>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name/ID</TableHead>
                <TableHead>Query Match</TableHead>
                <TableHead>Match Type</TableHead>
                <TableHead>Rules</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {curations.map((curation) => {
                const includeCount = curation.includes?.length || 0
                const excludeCount = curation.excludes?.length || 0
                const pinnedCount = curation.includes?.filter(inc => inc.position > 0).length || 0

                const now = Date.now() / 1000
                const isActive =
                  (!curation.effective_from_ts || curation.effective_from_ts <= now) &&
                  (!curation.effective_to_ts || curation.effective_to_ts >= now)

                return (
                  <TableRow key={curation.id}>
                    <TableCell className="font-mono font-semibold">
                      {curation.id}
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {curation.rule.query}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {curation.rule.match || 'exact'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {pinnedCount > 0 && (
                          <Badge variant="default">
                            {pinnedCount} pinned
                          </Badge>
                        )}
                        {includeCount > 0 && (
                          <Badge variant="secondary">
                            {includeCount} included
                          </Badge>
                        )}
                        {excludeCount > 0 && (
                          <Badge variant="destructive">
                            {excludeCount} excluded
                          </Badge>
                        )}
                        {includeCount === 0 && excludeCount === 0 && pinnedCount === 0 && (
                          <span className="text-gray-400 text-sm">No rules</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isActive ? "default" : "outline"}>
                        {isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <RAButton
                          label="Edit"
                          onClick={() => handleEdit(curation.id)}
                          size="small"
                        />
                        <RAButton
                          label="Delete"
                          onClick={() => handleDelete(curation.id)}
                          color="error"
                          size="small"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export { CurationSetList }
