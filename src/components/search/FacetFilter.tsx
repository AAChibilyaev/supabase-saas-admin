import React, { useState } from 'react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { ScrollArea } from '../ui/scroll-area'
import {
  ChevronDown,
  ChevronRight,
  Search,
  X,
  TrendingUp,
  Hash
} from 'lucide-react'
import type { Facet, FacetValue } from '../../types/typesense'

interface FacetFilterProps {
  facet: Facet
  onToggle: (fieldName: string, value: string) => void
  onClear?: (fieldName: string) => void
  maxVisible?: number
  searchable?: boolean
  showStats?: boolean
  className?: string
}

export const FacetFilter: React.FC<FacetFilterProps> = ({
  facet,
  onToggle,
  onClear,
  maxVisible = 10,
  searchable = true,
  showStats = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAll, setShowAll] = useState(false)

  const selectedCount = facet.values.filter(v => v.selected).length

  // Filter facet values based on search query
  const filteredValues = searchQuery
    ? facet.values.filter(v =>
        v.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : facet.values

  // Limit visible values
  const visibleValues = showAll
    ? filteredValues
    : filteredValues.slice(0, maxVisible)

  const hasMore = filteredValues.length > maxVisible

  const handleClear = () => {
    onClear?.(facet.fieldName)
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
          <span className="font-medium text-sm">{facet.fieldName}</span>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedCount}
            </Badge>
          )}
        </div>
        {selectedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Search */}
          {searchable && facet.values.length > 5 && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search values..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {/* Stats */}
          {showStats && facet.stats && (
            <div className="grid grid-cols-2 gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-md text-xs">
              {facet.stats.min !== undefined && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Min</div>
                  <div className="font-mono font-semibold">{facet.stats.min}</div>
                </div>
              )}
              {facet.stats.max !== undefined && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Max</div>
                  <div className="font-mono font-semibold">{facet.stats.max}</div>
                </div>
              )}
              {facet.stats.avg !== undefined && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Avg</div>
                  <div className="font-mono font-semibold">{facet.stats.avg.toFixed(2)}</div>
                </div>
              )}
              {facet.stats.sum !== undefined && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Sum</div>
                  <div className="font-mono font-semibold">{facet.stats.sum}</div>
                </div>
              )}
            </div>
          )}

          {/* Values */}
          {visibleValues.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No matching values
            </div>
          ) : (
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {visibleValues.map((value) => (
                  <FacetValueItem
                    key={value.value}
                    value={value}
                    fieldName={facet.fieldName}
                    onToggle={onToggle}
                  />
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Show More */}
          {hasMore && !searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full text-xs"
            >
              {showAll ? 'Show Less' : `Show ${filteredValues.length - maxVisible} More`}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

interface FacetValueItemProps {
  value: FacetValue
  fieldName: string
  onToggle: (fieldName: string, value: string) => void
}

const FacetValueItem: React.FC<FacetValueItemProps> = ({
  value,
  fieldName,
  onToggle
}) => {
  return (
    <div className="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-md transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Checkbox
          id={`${fieldName}-${value.value}`}
          checked={value.selected}
          onCheckedChange={() => onToggle(fieldName, value.value)}
        />
        <Label
          htmlFor={`${fieldName}-${value.value}`}
          className="text-sm cursor-pointer flex-1 min-w-0 truncate"
          title={value.value}
        >
          {value.highlighted ? (
            <span
              dangerouslySetInnerHTML={{
                __html: value.highlighted
                  .replace(/<mark>/g, '<span class="bg-yellow-200 dark:bg-yellow-900 font-semibold px-0.5 rounded">')
                  .replace(/<\/mark>/g, '</span>')
              }}
            />
          ) : (
            value.value
          )}
        </Label>
      </div>
      <Badge variant="secondary" className="text-xs font-mono">
        {value.count.toLocaleString()}
      </Badge>
    </div>
  )
}

interface FacetFiltersGroupProps {
  facets: Facet[]
  onToggle: (fieldName: string, value: string) => void
  onClear?: (fieldName: string) => void
  onClearAll?: () => void
  className?: string
}

export const FacetFiltersGroup: React.FC<FacetFiltersGroupProps> = ({
  facets,
  onToggle,
  onClear,
  onClearAll,
  className = ''
}) => {
  const totalSelected = facets.reduce(
    (sum, facet) => sum + facet.values.filter(v => v.selected).length,
    0
  )

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Facet Filters</h3>
        </div>
        {totalSelected > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="text-xs"
          >
            Clear All ({totalSelected})
          </Button>
        )}
      </div>

      {/* Facets */}
      {facets.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Hash className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No facets available</p>
          <p className="text-xs mt-1">Add facet_by parameter to enable filtering</p>
        </div>
      ) : (
        <div className="space-y-3">
          {facets.map((facet) => (
            <FacetFilter
              key={facet.fieldName}
              facet={facet}
              onToggle={onToggle}
              onClear={onClear}
            />
          ))}
        </div>
      )}
    </div>
  )
}
