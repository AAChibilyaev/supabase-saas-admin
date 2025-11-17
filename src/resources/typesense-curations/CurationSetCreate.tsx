import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useNotify } from 'react-admin'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react'
import { typesenseClient } from '../../providers/typesenseClient'

interface IncludeRule {
  id: string
  position: number
}

interface ExcludeRule {
  id: string
}

interface CollectionResponse {
  name: string
  num_documents: number
}

export const CurationSetCreate = () => {
  const navigate = useNavigate()
  const notify = useNotify()
  const [searchParams] = useSearchParams()

  const [collections, setCollections] = useState<CollectionResponse[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>(
    searchParams.get('collection') || ''
  )

  const [curationId, setCurationId] = useState('')
  const [query, setQuery] = useState('')
  const [matchType, setMatchType] = useState<'exact' | 'contains'>('exact')

  const [includes, setIncludes] = useState<IncludeRule[]>([])
  const [excludes, setExcludeRule] = useState<ExcludeRule[]>([])

  const [newIncludeId, setNewIncludeId] = useState('')
  const [newIncludePosition, setNewIncludePosition] = useState<number>(1)
  const [newExcludeId, setNewExcludeId] = useState('')

  const [filterBy, setFilterBy] = useState('')
  const [filterCuratedHits, setFilterCuratedHits] = useState(false)
  const [removeMatchedTokens, setRemoveMatchedTokens] = useState(false)

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      return
    }

    try {
      const response = await typesenseClient.collections().retrieve()
      setCollections(response)

      if (response.length > 0 && !selectedCollection) {
        setSelectedCollection(response[0].name)
      }
    } catch (error: any) {
      notify(`Failed to load collections: ${error.message}`, { type: 'error' })
      console.error('Error loading collections:', error)
    }
  }

  const addInclude = () => {
    if (!newIncludeId.trim()) {
      notify('Document ID is required', { type: 'warning' })
      return
    }

    if (includes.some((inc) => inc.id === newIncludeId)) {
      notify('Document already in includes list', { type: 'warning' })
      return
    }

    setIncludes([...includes, { id: newIncludeId, position: newIncludePosition }])
    setNewIncludeId('')
    setNewIncludePosition(1)
  }

  const removeInclude = (id: string) => {
    setIncludes(includes.filter((inc) => inc.id !== id))
  }

  const updateIncludePosition = (id: string, position: number) => {
    setIncludes(
      includes.map((inc) => (inc.id === id ? { ...inc, position } : inc))
    )
  }

  const addExclude = () => {
    if (!newExcludeId.trim()) {
      notify('Document ID is required', { type: 'warning' })
      return
    }

    if (excludes.some((exc) => exc.id === newExcludeId)) {
      notify('Document already in excludes list', { type: 'warning' })
      return
    }

    setExcludeRule([...excludes, { id: newExcludeId }])
    setNewExcludeId('')
  }

  const removeExclude = (id: string) => {
    setExcludeRule(excludes.filter((exc) => exc.id !== id))
  }

  const validateForm = (): string | null => {
    if (!selectedCollection) {
      return 'Please select a collection'
    }

    if (!curationId.trim()) {
      return 'Curation ID is required'
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(curationId)) {
      return 'Curation ID can only contain alphanumeric characters, underscores, and hyphens'
    }

    if (!query.trim()) {
      return 'Query is required'
    }

    return null
  }

  const handleCreate = async () => {
    const error = validateForm()
    if (error) {
      notify(error, { type: 'error' })
      return
    }

    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      return
    }

    setLoading(true)

    try {
      const rule: any = {
        rule: {
          query,
          match: matchType,
        },
      }

      if (includes.length > 0) {
        rule.includes = includes
      }

      if (excludes.length > 0) {
        rule.excludes = excludes
      }

      if (filterBy) {
        rule.filter_by = filterBy
      }

      if (filterCuratedHits) {
        rule.filter_curated_hits = true
      }

      if (removeMatchedTokens) {
        rule.remove_matched_tokens = true
      }

      await (typesenseClient as any)
        .collections(selectedCollection)
        .overrides()
        .upsert(curationId, rule)

      notify(`Curation "${curationId}" created successfully`, {
        type: 'success',
      })
      navigate('/typesense-curations')
    } catch (error: any) {
      notify(`Failed to create curation: ${error.message}`, { type: 'error' })
      console.error('Error creating curation:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Create Curation Set</h1>
          <p className="text-gray-600 mt-1">
            Define rules to customize search results for specific queries
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/typesense-curations')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Configure the collection and query matching rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collection">Collection *</Label>
              <Select
                value={selectedCollection}
                onValueChange={setSelectedCollection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a collection" />
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

            <div className="space-y-2">
              <Label htmlFor="curationId">Curation ID *</Label>
              <Input
                id="curationId"
                placeholder="e.g., featured-products, hide-out-of-stock"
                value={curationId}
                onChange={(e) => setCurationId(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Unique identifier for this curation rule
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="query">Query Match *</Label>
              <Input
                id="query"
                placeholder="e.g., laptop, shoes, iphone"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                The search query this curation rule should match
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="matchType">Match Type</Label>
              <Select
                value={matchType}
                onValueChange={(value) =>
                  setMatchType(value as 'exact' | 'contains')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">Exact Match</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                How the query should be matched
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Includes - Pinned & Promoted Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Included & Pinned Documents</CardTitle>
            <CardDescription>
              Pin documents at specific positions or promote them in results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="includeId">Document ID</Label>
                <Input
                  id="includeId"
                  placeholder="Document ID to include/pin"
                  value={newIncludeId}
                  onChange={(e) => setNewIncludeId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addInclude()}
                />
              </div>
              <div className="w-32">
                <Label htmlFor="includePosition">Position</Label>
                <Input
                  id="includePosition"
                  type="number"
                  min="1"
                  value={newIncludePosition}
                  onChange={(e) =>
                    setNewIncludePosition(parseInt(e.target.value) || 1)
                  }
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addInclude} type="button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Position 1 = first result, 2 = second result, etc. Use position 1 to
              pin at top.
            </p>

            {includes.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document ID</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {includes.map((include) => (
                    <TableRow key={include.id}>
                      <TableCell className="font-mono">{include.id}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={include.position}
                          onChange={(e) =>
                            updateIncludePosition(
                              include.id,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={include.position === 1 ? 'default' : 'secondary'}>
                          {include.position === 1 ? 'Pinned' : 'Included'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInclude(include.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Excludes */}
        <Card>
          <CardHeader>
            <CardTitle>Excluded Documents</CardTitle>
            <CardDescription>
              Hide specific documents from search results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="excludeId">Document ID</Label>
                <Input
                  id="excludeId"
                  placeholder="Document ID to exclude"
                  value={newExcludeId}
                  onChange={(e) => setNewExcludeId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addExclude()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addExclude} type="button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            {excludes.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {excludes.map((exclude) => (
                    <TableRow key={exclude.id}>
                      <TableCell className="font-mono">{exclude.id}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExclude(exclude.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Advanced Options */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Options</CardTitle>
            <CardDescription>
              Additional filtering and processing rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filterBy">Filter Expression (Optional)</Label>
              <Textarea
                id="filterBy"
                placeholder="e.g., category:=Electronics && price:<1000"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                rows={2}
              />
              <p className="text-sm text-gray-500">
                Additional Typesense filter to apply to curated results
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="filterCuratedHits"
                  checked={filterCuratedHits}
                  onChange={(e) => setFilterCuratedHits(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="filterCuratedHits" className="cursor-pointer">
                  Filter curated hits
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="removeMatchedTokens"
                  checked={removeMatchedTokens}
                  onChange={(e) => setRemoveMatchedTokens(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="removeMatchedTokens" className="cursor-pointer">
                  Remove matched tokens
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/typesense-curations')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Curation'}
          </Button>
        </div>
      </div>
    </div>
  )
}
