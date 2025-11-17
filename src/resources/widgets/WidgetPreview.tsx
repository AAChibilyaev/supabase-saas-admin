import { useState } from 'react'
import { Box, Paper, Typography, IconButton, Grid } from '@mui/material'
import { Smartphone, Tablet, Monitor } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'

interface WidgetPreviewProps {
  config: any
}

type DeviceType = 'mobile' | 'tablet' | 'desktop'

export const WidgetPreview = ({ config }: WidgetPreviewProps) => {
  const [device, setDevice] = useState<DeviceType>('desktop')
  const [searchQuery, setSearchQuery] = useState('')

  const deviceWidths: Record<DeviceType, string> = {
    mobile: '375px',
    tablet: '768px',
    desktop: '100%',
  }

  // Mock search results for preview
  const mockResults = [
    {
      id: 1,
      title: 'Getting Started with Search',
      snippet: 'Learn how to implement powerful search functionality in your application...',
      image: 'https://via.placeholder.com/150',
    },
    {
      id: 2,
      title: 'Advanced Search Techniques',
      snippet: 'Discover advanced filtering, faceting, and ranking strategies...',
      image: 'https://via.placeholder.com/150',
    },
    {
      id: 3,
      title: 'Search Analytics Guide',
      snippet: 'Track and analyze search behavior to improve user experience...',
      image: 'https://via.placeholder.com/150',
    },
  ]

  const renderSearchWidget = () => {
    const theme = config.theme || {}
    const searchSettings = config.searchSettings || {}
    const displaySettings = config.displaySettings || {}
    const features = config.features || {}

    return (
      <div
        style={{
          fontFamily: theme.fontFamily || 'Inter, sans-serif',
          maxWidth: deviceWidths[device],
          margin: '0 auto',
        }}
      >
        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <Input
              type="text"
              placeholder={searchSettings.placeholder || 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              style={{
                borderRadius: theme.borderRadius || '0.5rem',
                borderColor: theme.primaryColor || '#3b82f6',
              }}
            />
            {features.voiceSearch && (
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Voice search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Autocomplete suggestions */}
          {features.autocomplete && searchQuery && (
            <div
              className="mt-2 border rounded shadow-lg bg-white"
              style={{
                borderRadius: theme.borderRadius || '0.5rem',
              }}
            >
              <div className="p-2 space-y-1">
                {['search suggestion 1', 'search suggestion 2', 'search suggestion 3'].map(
                  (suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                      style={{ borderRadius: theme.borderRadius || '0.5rem' }}
                    >
                      {suggestion}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Filters (if enabled) */}
        {searchSettings.enableFilters && (
          <div className="mb-4 flex gap-2 flex-wrap">
            <Badge className="cursor-pointer">Category: All</Badge>
            <Badge className="cursor-pointer">Type: All</Badge>
            <Badge className="cursor-pointer">Date: Any</Badge>
          </div>
        )}

        {/* Sorting (if enabled) */}
        {searchSettings.enableSorting && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              className="text-sm border rounded px-2 py-1"
              style={{ borderRadius: theme.borderRadius || '0.5rem' }}
            >
              <option>Relevance</option>
              <option>Date (Newest)</option>
              <option>Date (Oldest)</option>
              <option>Title (A-Z)</option>
            </select>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-3 text-sm text-gray-600">
          Found {mockResults.length} results
        </div>

        {/* Search Results */}
        <div
          className={
            displaySettings.layout === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
              : 'space-y-4'
          }
        >
          {mockResults.map((result) => (
            <div
              key={result.id}
              className="border p-4 hover:shadow-lg transition-shadow cursor-pointer"
              style={{
                borderRadius: theme.borderRadius || '0.5rem',
                borderColor: theme.secondaryColor || '#e5e7eb',
              }}
            >
              <div className={displaySettings.layout === 'compact' ? 'flex gap-3' : ''}>
                {displaySettings.showThumbnails && (
                  <img
                    src={result.image}
                    alt={result.title}
                    className={
                      displaySettings.layout === 'compact'
                        ? 'w-16 h-16 object-cover rounded'
                        : 'w-full h-32 object-cover rounded mb-3'
                    }
                    style={{ borderRadius: theme.borderRadius || '0.5rem' }}
                  />
                )}
                <div className="flex-1">
                  <h3
                    className="font-semibold mb-1"
                    style={{ color: theme.primaryColor || '#1e40af' }}
                  >
                    {displaySettings.highlightMatches && searchQuery ? (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: result.title.replace(
                            new RegExp(searchQuery, 'gi'),
                            (match) => `<mark class="bg-yellow-200">${match}</mark>`
                          ),
                        }}
                      />
                    ) : (
                      result.title
                    )}
                  </h3>
                  {displaySettings.showSnippets && (
                    <p className="text-sm text-gray-600 line-clamp-2">{result.snippet}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Badge>1</Badge>
          <Badge variant="outline">2</Badge>
          <Badge variant="outline">3</Badge>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Widget Preview</CardTitle>
            <CardDescription>
              See how your widget will look on different devices
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <IconButton
              size="small"
              onClick={() => setDevice('mobile')}
              color={device === 'mobile' ? 'primary' : 'default'}
            >
              <Smartphone className="w-5 h-5" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setDevice('tablet')}
              color={device === 'tablet' ? 'primary' : 'default'}
            >
              <Tablet className="w-5 h-5" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setDevice('desktop')}
              color={device === 'desktop' ? 'primary' : 'default'}
            >
              <Monitor className="w-5 h-5" />
            </IconButton>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-6 bg-gray-50 min-h-[600px]">
          {renderSearchWidget()}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>
            <strong>Note:</strong> This is a live preview. Changes to configuration will update
            the preview in real-time.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
