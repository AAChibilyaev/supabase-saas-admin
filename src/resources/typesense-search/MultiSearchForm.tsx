import { useState, useEffect } from 'react'
import { useNotify, Title } from 'react-admin'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Card } from '../../components/ui/card'
import { typesenseClient } from '../../providers/typesenseClient'
import { SearchResults } from './SearchResults'
import { Plus, Trash2, Search as SearchIcon, Settings2, X } from 'lucide-react'

interface SearchQuery {
  collection: string
  q: string
  query_by: string
  filter_by: string
  sort_by: string
  facet_by: string
  per_page: number
  num_typos: number
  prefix: boolean
}

interface Filter {
  field: string
  operator: string
  value: string
}

export const MultiSearchForm = () => {
  const [searches, setSearches] = useState<SearchQuery[]>([
    {
      collection: '',
      q: '',
      query_by: '',
      filter_by: '',
      sort_by: '',
      facet_by: '',
      per_page: 10,
      num_typos: 2,
      prefix: true,
    },
  ])
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [collections, setCollections] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState<{ [key: number]: boolean }>(
    {}
  )
  const [filters, setFilters] = useState<{ [key: number]: Filter[] }>({})
  const notify = useNotify()

  // Load available collections
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
      setCollections(response.map((col: any) => col.name))
    } catch (error: any) {
      notify(`Failed to load collections: ${error.message}`, { type: 'error' })
    }
  }

  const addSearch = () => {
    setSearches([
      ...searches,
      {
        collection: '',
        q: '',
        query_by: '',
        filter_by: '',
        sort_by: '',
        facet_by: '',
        per_page: 10,
        num_typos: 2,
        prefix: true,
      },
    ])
  }

  const removeSearch = (index: number) => {
    if (searches.length > 1) {
      const newSearches = searches.filter((_, i) => i !== index)
      setSearches(newSearches)
      const newFilters = { ...filters }
      delete newFilters[index]
      setFilters(newFilters)
      const newShowAdvanced = { ...showAdvanced }
      delete newShowAdvanced[index]
      setShowAdvanced(newShowAdvanced)
    }
  }

  const updateSearch = (
    index: number,
    field: keyof SearchQuery,
    value: any
  ) => {
    const updated = [...searches]
    updated[index] = { ...updated[index], [field]: value }
    setSearches(updated)
  }

  const toggleAdvanced = (index: number) => {
    setShowAdvanced({
      ...showAdvanced,
      [index]: !showAdvanced[index],
    })
  }

  const addFilter = (searchIndex: number) => {
    const searchFilters = filters[searchIndex] || []
    setFilters({
      ...filters,
      [searchIndex]: [
        ...searchFilters,
        { field: '', operator: ':', value: '' },
      ],
    })
  }

  const updateFilter = (
    searchIndex: number,
    filterIndex: number,
    field: keyof Filter,
    value: string
  ) => {
    const searchFilters = [...(filters[searchIndex] || [])]
    searchFilters[filterIndex] = { ...searchFilters[filterIndex], [field]: value }
    setFilters({
      ...filters,
      [searchIndex]: searchFilters,
    })
  }

  const removeFilter = (searchIndex: number, filterIndex: number) => {
    const searchFilters = (filters[searchIndex] || []).filter(
      (_, i) => i !== filterIndex
    )
    setFilters({
      ...filters,
      [searchIndex]: searchFilters,
    })
  }

  const buildFilterString = (searchIndex: number): string => {
    const searchFilters = filters[searchIndex] || []
    return searchFilters
      .filter((f) => f.field && f.value)
      .map((f) => `${f.field}${f.operator}${f.value}`)
      .join(' && ')
  }

  const executeSearch = async () => {
    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      return
    }

    // Validate at least one collection is selected
    if (!searches.some((s) => s.collection)) {
      notify('Please select at least one collection to search', {
        type: 'warning',
      })
      return
    }

    try {
      setLoading(true)
      const searchRequests = {
        searches: searches
          .filter((s) => s.collection) // Only include searches with collection selected
          .map((s, index) => {
            const filterStr = buildFilterString(index) || s.filter_by
            const searchParams: any = {
              collection: s.collection,
              q: s.q || '*',
              query_by: s.query_by || '*',
              per_page: s.per_page,
            }

            // Add optional parameters only if they have values
            if (filterStr) searchParams.filter_by = filterStr
            if (s.sort_by) searchParams.sort_by = s.sort_by
            if (s.facet_by) searchParams.facet_by = s.facet_by
            if (s.num_typos !== undefined) searchParams.num_typos = s.num_typos
            if (s.prefix !== undefined) searchParams.prefix = s.prefix

            return searchParams
          }),
      }

      const startTime = performance.now()
      const result = await typesenseClient.multiSearch.perform(searchRequests)
      const endTime = performance.now()

      setResults({
        ...result,
        totalTime: Math.round(endTime - startTime),
      })

      notify(
        `Found results in ${result.results.length} collection(s) (${Math.round(endTime - startTime)}ms)`,
        { type: 'success' }
      )
    } catch (error: any) {
      notify(`Search failed: ${error.message}`, { type: 'error' })
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!typesenseClient) {
    return (
      <div className="p-8 text-center">
        <SearchIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">
          Typesense Not Configured
        </h2>
        <p className="text-gray-600">
          Please configure Typesense environment variables to use this feature.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <Title title="Multi-Collection Search" />
        <div className="flex gap-2">
          <Button variant="outline" onClick={addSearch}>
            <Plus className="w-4 h-4 mr-2" />
            Add Search
          </Button>
          <Button
            onClick={executeSearch}
            disabled={loading || !searches.some((s) => s.collection)}
          >
            <SearchIcon className="w-4 h-4 mr-2" />
            {loading ? 'Searching...' : 'Execute Multi-Search'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {searches.map((search, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Search #{index + 1}
                {search.collection && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({search.collection})
                  </span>
                )}
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAdvanced(index)}
                >
                  <Settings2 className="w-4 h-4 mr-1" />
                  {showAdvanced[index] ? 'Hide' : 'Show'} Advanced
                </Button>
                {searches.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSearch(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Collection Selection */}
              <div>
                <Label htmlFor={`collection-${index}`}>Collection *</Label>
                <Select
                  value={search.collection}
                  onValueChange={(value) =>
                    updateSearch(index, 'collection', value)
                  }
                >
                  <SelectTrigger id={`collection-${index}`}>
                    <SelectValue placeholder="Select collection..." />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Query */}
              <div>
                <Label htmlFor={`q-${index}`}>Search Query</Label>
                <Input
                  id={`q-${index}`}
                  placeholder="e.g., laptop, * for all documents"
                  value={search.q}
                  onChange={(e) => updateSearch(index, 'q', e.target.value)}
                />
              </div>

              {/* Query By Fields */}
              <div>
                <Label htmlFor={`query_by-${index}`}>Search Fields</Label>
                <Input
                  id={`query_by-${index}`}
                  placeholder="e.g., title,description,content"
                  value={search.query_by}
                  onChange={(e) =>
                    updateSearch(index, 'query_by', e.target.value)
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Comma-separated field names to search in
                </p>
              </div>

              {/* Advanced Options */}
              {showAdvanced[index] && (
                <div className="space-y-4 pt-4 border-t">
                  {/* Filters */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Filters</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addFilter(index)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Filter
                      </Button>
                    </div>

                    {(filters[index] || []).map((filter, filterIndex) => (
                      <div
                        key={filterIndex}
                        className="flex gap-2 items-end mb-2"
                      >
                        <div className="flex-1">
                          <Input
                            placeholder="Field"
                            value={filter.field}
                            onChange={(e) =>
                              updateFilter(
                                index,
                                filterIndex,
                                'field',
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="w-32">
                          <Select
                            value={filter.operator}
                            onValueChange={(value) =>
                              updateFilter(index, filterIndex, 'operator', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Operator" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value=":">equals (:)</SelectItem>
                              <SelectItem value=":=">contains (:=)</SelectItem>
                              <SelectItem value=":>">
                                greater than (:&gt;)
                              </SelectItem>
                              <SelectItem value=":<">
                                less than (:&lt;)
                              </SelectItem>
                              <SelectItem value=":>=">
                                greater or equal (:&gt;=)
                              </SelectItem>
                              <SelectItem value=":<=">
                                less or equal (:&lt;=)
                              </SelectItem>
                              <SelectItem value=":!=">
                                not equal (:!=)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="Value"
                            value={filter.value}
                            onChange={(e) =>
                              updateFilter(
                                index,
                                filterIndex,
                                'value',
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(index, filterIndex)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    {/* Manual filter input as fallback */}
                    <div className="mt-2">
                      <Label htmlFor={`filter_by-${index}`}>
                        Manual Filter (Advanced)
                      </Label>
                      <Input
                        id={`filter_by-${index}`}
                        placeholder="e.g., price:>100 && category:=electronics"
                        value={search.filter_by}
                        onChange={(e) =>
                          updateSearch(index, 'filter_by', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <Label htmlFor={`sort_by-${index}`}>Sort By</Label>
                    <Input
                      id={`sort_by-${index}`}
                      placeholder="e.g., price:asc, rating:desc"
                      value={search.sort_by}
                      onChange={(e) =>
                        updateSearch(index, 'sort_by', e.target.value)
                      }
                    />
                  </div>

                  {/* Facet By */}
                  <div>
                    <Label htmlFor={`facet_by-${index}`}>Facet By</Label>
                    <Input
                      id={`facet_by-${index}`}
                      placeholder="e.g., category,brand,price_range"
                      value={search.facet_by}
                      onChange={(e) =>
                        updateSearch(index, 'facet_by', e.target.value)
                      }
                    />
                  </div>

                  {/* Results Per Page */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`per_page-${index}`}>
                        Results Per Page
                      </Label>
                      <Input
                        id={`per_page-${index}`}
                        type="number"
                        min="1"
                        max="250"
                        value={search.per_page}
                        onChange={(e) =>
                          updateSearch(
                            index,
                            'per_page',
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor={`num_typos-${index}`}>
                        Typo Tolerance
                      </Label>
                      <Input
                        id={`num_typos-${index}`}
                        type="number"
                        min="0"
                        max="3"
                        value={search.num_typos}
                        onChange={(e) =>
                          updateSearch(
                            index,
                            'num_typos',
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={search.prefix}
                          onChange={(e) =>
                            updateSearch(index, 'prefix', e.target.checked)
                          }
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Prefix Search</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Search Results */}
      {results && <SearchResults results={results} />}
    </div>
  )
}
