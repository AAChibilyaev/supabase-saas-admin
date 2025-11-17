import { useState, useEffect } from 'react'
import { useNotify, Button as RAButton } from 'react-admin'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'
import { Checkbox } from '../../components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Plus, Settings, Trash2, Edit } from 'lucide-react'
import { typesenseClient } from '../../providers/typesenseClient'

interface AnalyticsRule {
  name: string
  type: 'popular_queries' | 'nohits_queries' | 'counter'
  params: {
    source?: {
      collections?: string[]
      events?: Array<{ type: string; weight?: number; name?: string }>
    }
    destination?: {
      collection?: string
      counter_field?: string
    }
    limit?: number
    expand_query?: boolean
  }
}

interface RuleFormData {
  name: string
  type: 'popular_queries' | 'nohits_queries' | 'counter'
  collections: string[]
  limit: number
  expand_query: boolean
  destination_collection: string
}

export const AnalyticsRules = () => {
  const [rules, setRules] = useState<AnalyticsRule[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AnalyticsRule | null>(null)
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    type: 'popular_queries',
    collections: ['*'],
    limit: 1000,
    expand_query: false,
    destination_collection: 'top_queries'
  })
  const notify = useNotify()

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await (typesenseClient as any).analytics.rules().retrieve()
      setRules(response.rules || [])
    } catch (error: any) {
      notify(`Failed to load analytics rules: ${error.message}`, { type: 'error' })
      console.error('Error loading analytics rules:', error)
      setRules([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = async () => {
    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      return
    }

    if (!formData.name) {
      notify('Rule name is required', { type: 'warning' })
      return
    }

    try {
      const ruleSchema: any = {
        type: formData.type,
        params: {
          source: {
            collections: formData.collections
          },
          destination: {
            collection: formData.destination_collection
          },
          limit: formData.limit
        }
      }

      if (formData.type === 'popular_queries') {
        ruleSchema.params.expand_query = formData.expand_query
      }

      await (typesenseClient as any)
        .analytics
        .rules()
        .upsert(formData.name, ruleSchema)

      notify('Analytics rule created successfully', { type: 'success' })
      setDialogOpen(false)
      resetForm()
      loadRules()
    } catch (error: any) {
      notify(`Failed to create analytics rule: ${error.message}`, { type: 'error' })
      console.error('Error creating analytics rule:', error)
    }
  }

  const handleDeleteRule = async (ruleName: string) => {
    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      return
    }

    if (!window.confirm(`Are you sure you want to delete the rule "${ruleName}"?`)) {
      return
    }

    try {
      await (typesenseClient as any).analytics.rules(ruleName).delete()
      notify('Analytics rule deleted successfully', { type: 'success' })
      loadRules()
    } catch (error: any) {
      notify(`Failed to delete analytics rule: ${error.message}`, { type: 'error' })
      console.error('Error deleting analytics rule:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'popular_queries',
      collections: ['*'],
      limit: 1000,
      expand_query: false,
      destination_collection: 'top_queries'
    })
    setEditingRule(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  if (!typesenseClient) {
    return (
      <div className="p-8 text-center">
        <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
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
            <Settings className="w-6 h-6" />
            Analytics Rules
          </h1>
          <p className="text-gray-600 mt-1">
            Configure analytics rules to track queries, clicks, and conversions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Analytics Rule</DialogTitle>
              <DialogDescription>
                Configure a new analytics rule to aggregate search data
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ruleName">Rule Name</Label>
                <Input
                  id="ruleName"
                  placeholder="e.g., top_product_searches"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ruleType">Rule Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="ruleType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular_queries">Popular Queries</SelectItem>
                    <SelectItem value="nohits_queries">No-Hits Queries</SelectItem>
                    <SelectItem value="counter">Counter</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {formData.type === 'popular_queries' && 'Track most frequently searched queries'}
                  {formData.type === 'nohits_queries' && 'Track queries that return no results'}
                  {formData.type === 'counter' && 'Track custom event counters'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="collections">Collections</Label>
                <Input
                  id="collections"
                  placeholder="* (all collections) or comma-separated list"
                  value={formData.collections.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      collections: e.target.value.split(',').map(c => c.trim())
                    })
                  }
                />
                <p className="text-xs text-gray-500">
                  Use "*" for all collections or specify collection names
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination Collection</Label>
                <Input
                  id="destination"
                  placeholder="e.g., top_queries"
                  value={formData.destination_collection}
                  onChange={(e) =>
                    setFormData({ ...formData, destination_collection: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500">
                  Collection where aggregated data will be stored
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit">Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  placeholder="1000"
                  value={formData.limit}
                  onChange={(e) =>
                    setFormData({ ...formData, limit: parseInt(e.target.value) || 1000 })
                  }
                />
                <p className="text-xs text-gray-500">
                  Maximum number of items to track
                </p>
              </div>

              {formData.type === 'popular_queries' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="expandQuery"
                    checked={formData.expand_query}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, expand_query: checked as boolean })
                    }
                  />
                  <Label htmlFor="expandQuery" className="cursor-pointer">
                    Expand query with synonyms
                  </Label>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRule}>Create Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <p>Loading analytics rules...</p>
        </div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Rules</h3>
            <p className="text-gray-600 mb-4">
              Create your first analytics rule to start tracking search data
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Collections</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Limit</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.name}>
                  <TableCell className="font-mono font-semibold">
                    {rule.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {rule.type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(rule.params.source?.collections || ['*']).map((col, idx) => (
                        <Badge key={idx} variant="secondary">
                          {col}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {rule.params.destination?.collection || 'N/A'}
                    </code>
                  </TableCell>
                  <TableCell>{rule.params.limit || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <RAButton
                        label="Delete"
                        onClick={() => handleDeleteRule(rule.name)}
                        color="error"
                        size="small"
                      >
                        <Trash2 className="w-4 h-4" />
                      </RAButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Popular Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Tracks the most frequently searched queries across your collections.
              Useful for understanding user intent and optimizing content.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">No-Hits Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Identifies queries that return zero results. Use this data to improve
              your search coverage and add missing content.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Counter Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Create custom counters for specific events like clicks, conversions,
              or any other user interactions you want to track.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
