import { useState, useEffect } from 'react'
import { useNotify, Button as RAButton } from 'react-admin'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'
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
import { Calendar } from '../../components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover'
import { Activity, Download, Filter, Calendar as CalendarIcon, RefreshCw } from 'lucide-react'
import { typesenseClient } from '../../providers/typesenseClient'
import { format, subDays } from 'date-fns'
import jsonexport from 'jsonexport'

interface AnalyticsEvent {
  type: string
  name: string
  data?: Record<string, any>
  timestamp?: number
  user_id?: string
  doc_id?: string
  q?: string
}

interface EventFilters {
  type: string
  collection: string
  dateFrom: Date
  dateTo: Date
  searchQuery: string
}

export const AnalyticsEvents = () => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<EventFilters>({
    type: 'all',
    collection: 'all',
    dateFrom: subDays(new Date(), 7),
    dateTo: new Date(),
    searchQuery: ''
  })
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const notify = useNotify()

  useEffect(() => {
    loadEvents()
  }, [filters.type, filters.collection])

  const loadEvents = async () => {
    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // In production, this would fetch real analytics events from Typesense
      // For now, we'll generate mock data
      const mockEvents: AnalyticsEvent[] = Array.from({ length: 50 }, (_, i) => {
        const eventTypes = ['search', 'click', 'conversion', 'visit']
        const collections = ['products', 'articles', 'users']
        const queries = ['laptop', 'smartphone', 'headphones', 'keyboard', 'monitor']

        const type = eventTypes[Math.floor(Math.random() * eventTypes.length)]
        const timestamp = Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)

        const event: AnalyticsEvent = {
          type,
          name: `${type}_event_${i}`,
          timestamp,
          user_id: `user_${Math.floor(Math.random() * 100)}`,
        }

        if (type === 'search') {
          event.q = queries[Math.floor(Math.random() * queries.length)]
          event.data = {
            collection: collections[Math.floor(Math.random() * collections.length)],
            results_count: Math.floor(Math.random() * 100)
          }
        } else if (type === 'click') {
          event.doc_id = `doc_${Math.floor(Math.random() * 1000)}`
          event.data = {
            position: Math.floor(Math.random() * 10) + 1,
            collection: collections[Math.floor(Math.random() * collections.length)]
          }
        } else if (type === 'conversion') {
          event.doc_id = `doc_${Math.floor(Math.random() * 1000)}`
          event.data = {
            value: Math.floor(Math.random() * 500) + 50,
            currency: 'USD'
          }
        }

        return event
      })

      // Apply filters
      let filteredEvents = mockEvents

      if (filters.type !== 'all') {
        filteredEvents = filteredEvents.filter(e => e.type === filters.type)
      }

      if (filters.collection !== 'all') {
        filteredEvents = filteredEvents.filter(
          e => e.data?.collection === filters.collection
        )
      }

      if (filters.searchQuery) {
        filteredEvents = filteredEvents.filter(
          e =>
            e.q?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
            e.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
        )
      }

      // Sort by timestamp descending
      filteredEvents.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

      setEvents(filteredEvents)
    } catch (error: any) {
      notify(`Failed to load analytics events: ${error.message}`, { type: 'error' })
      console.error('Error loading analytics events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const exportData = events.map(event => ({
        Type: event.type,
        Name: event.name,
        Timestamp: event.timestamp ? format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        User_ID: event.user_id || 'N/A',
        Document_ID: event.doc_id || 'N/A',
        Query: event.q || 'N/A',
        Collection: event.data?.collection || 'N/A',
        Additional_Data: JSON.stringify(event.data || {})
      }))

      const csv = await jsonexport(exportData)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-events-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      notify('Events exported successfully', { type: 'success' })
    } catch (error: any) {
      notify(`Failed to export events: ${error.message}`, { type: 'error' })
    }
  }

  const getEventBadgeVariant = (type: string) => {
    switch (type) {
      case 'search':
        return 'default'
      case 'click':
        return 'secondary'
      case 'conversion':
        return 'default'
      case 'visit':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'search':
        return 'text-blue-600'
      case 'click':
        return 'text-green-600'
      case 'conversion':
        return 'text-purple-600'
      case 'visit':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  if (!typesenseClient) {
    return (
      <div className="p-8 text-center">
        <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">Typesense Not Configured</h2>
        <p className="text-gray-600">
          Please configure Typesense environment variables to use this feature.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Analytics Events
          </h1>
          <p className="text-gray-600 mt-1">
            Browse and filter analytics event history
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadEvents}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport} disabled={events.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger id="eventType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="search">Search</SelectItem>
                  <SelectItem value="click">Click</SelectItem>
                  <SelectItem value="conversion">Conversion</SelectItem>
                  <SelectItem value="visit">Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection">Collection</Label>
              <Select
                value={filters.collection}
                onValueChange={(value) => setFilters({ ...filters, collection: value })}
              >
                <SelectTrigger id="collection">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collections</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="articles">Articles</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRange">Date Range</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(filters.dateFrom, 'MMM dd')} - {format(filters.dateTo, 'MMM dd')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setFilters({
                          ...filters,
                          dateFrom: subDays(new Date(), 7),
                          dateTo: new Date()
                        })
                        setDatePickerOpen(false)
                      }}
                    >
                      Last 7 days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setFilters({
                          ...filters,
                          dateFrom: subDays(new Date(), 30),
                          dateTo: new Date()
                        })
                        setDatePickerOpen(false)
                      }}
                    >
                      Last 30 days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setFilters({
                          ...filters,
                          dateFrom: subDays(new Date(), 90),
                          dateTo: new Date()
                        })
                        setDatePickerOpen(false)
                      }}
                    >
                      Last 90 days
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchQuery">Search</Label>
              <Input
                id="searchQuery"
                placeholder="Filter by query or name..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Total Events</div>
            <div className="text-2xl font-bold mt-1">{events.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Search Events</div>
            <div className="text-2xl font-bold mt-1 text-blue-600">
              {events.filter(e => e.type === 'search').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Click Events</div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {events.filter(e => e.type === 'click').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Conversion Events</div>
            <div className="text-2xl font-bold mt-1 text-purple-600">
              {events.filter(e => e.type === 'conversion').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Table */}
      {loading ? (
        <div className="p-8 text-center">
          <p>Loading analytics events...</p>
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
            <p className="text-gray-600">
              Try adjusting your filters or check back later for new events
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Event History</CardTitle>
            <CardDescription>
              Showing {events.length} events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Query</TableHead>
                    <TableHead>Collection</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event, index) => (
                    <TableRow key={`${event.name}-${index}`}>
                      <TableCell>
                        <Badge variant={getEventBadgeVariant(event.type)}>
                          <span className={getEventColor(event.type)}>
                            {event.type}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {event.timestamp
                          ? format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm:ss')
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {event.user_id || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {event.q ? (
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {event.q}
                          </code>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.data?.collection ? (
                          <Badge variant="secondary">{event.data.collection}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {event.doc_id && (
                            <div>
                              <span className="text-gray-500">Doc:</span>{' '}
                              <span className="font-mono">{event.doc_id}</span>
                            </div>
                          )}
                          {event.data?.position && (
                            <div>
                              <span className="text-gray-500">Position:</span>{' '}
                              {event.data.position}
                            </div>
                          )}
                          {event.data?.results_count !== undefined && (
                            <div>
                              <span className="text-gray-500">Results:</span>{' '}
                              {event.data.results_count}
                            </div>
                          )}
                          {event.data?.value && (
                            <div>
                              <span className="text-gray-500">Value:</span>{' '}
                              {event.data.currency} {event.data.value}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
