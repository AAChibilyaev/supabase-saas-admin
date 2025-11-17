import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  BooleanField,
  NumberField,
  FunctionField,
  TabbedShowLayout,
  Tab,
  useRecordContext,
  TopToolbar,
  EditButton,
  DeleteButton,
} from 'react-admin'
import { Grid, Chip } from '@mui/material'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { WidgetPreview } from './WidgetPreview'
import { EmbedCodeDisplay } from './components/EmbedCodeDisplay'
import { AnalyticsDashboard } from './components/AnalyticsDashboard'

const WidgetShowActions = () => (
  <TopToolbar>
    <EditButton />
    <DeleteButton />
  </TopToolbar>
)

const WidgetTypeBadge = () => {
  const record = useRecordContext()
  if (!record) return null

  const colors: Record<string, string> = {
    'search': 'bg-blue-100 text-blue-800',
    'faceted-search': 'bg-purple-100 text-purple-800',
    'autocomplete': 'bg-green-100 text-green-800',
    'instant-search': 'bg-orange-100 text-orange-800',
  }

  return (
    <Badge className={colors[record.type] || 'bg-gray-100 text-gray-800'}>
      {record.type.replace('-', ' ')}
    </Badge>
  )
}

const StatusBadge = () => {
  const record = useRecordContext()
  if (!record) return null

  return (
    <Badge className={record.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
      {record.is_active ? 'Active' : 'Inactive'}
    </Badge>
  )
}

export const WidgetShow = () => {
  return (
    <Show actions={<WidgetShowActions />}>
      <TabbedShowLayout>
        {/* Overview Tab */}
        <Tab label="Overview">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader>
                  <CardTitle>Widget Information</CardTitle>
                  <CardDescription>Basic details about this widget</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Name</label>
                    <TextField source="name" className="block" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Type</label>
                    <div className="mt-1">
                      <WidgetTypeBadge />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Status</label>
                    <div className="mt-1">
                      <StatusBadge />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Description</label>
                    <TextField source="description" className="block" />
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                  <CardDescription>Widget usage metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded">
                    <label className="text-sm font-semibold text-gray-600">Total Uses</label>
                    <NumberField source="usage_count" className="block text-2xl font-bold text-blue-600" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Last Used</label>
                    <DateField source="last_used_at" showTime className="block" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Created</label>
                    <DateField source="created_at" showTime className="block" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Last Modified</label>
                    <DateField source="updated_at" showTime className="block" />
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardHeader>
                  <CardTitle>Configuration Summary</CardTitle>
                  <CardDescription>Overview of widget settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <FunctionField
                    render={(record: any) => {
                      const config = record.configuration || {}
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded">
                            <h4 className="font-semibold mb-2">Search Settings</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Collection:</strong> {config.searchSettings?.collection || 'Not set'}</p>
                              <p><strong>Results per page:</strong> {config.searchSettings?.resultsPerPage || 10}</p>
                              <p><strong>Filters:</strong> {config.searchSettings?.enableFilters ? 'Enabled' : 'Disabled'}</p>
                              <p><strong>Sorting:</strong> {config.searchSettings?.enableSorting ? 'Enabled' : 'Disabled'}</p>
                            </div>
                          </div>
                          <div className="p-4 border rounded">
                            <h4 className="font-semibold mb-2">Display Settings</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Layout:</strong> {config.displaySettings?.layout || 'list'}</p>
                              <p><strong>Thumbnails:</strong> {config.displaySettings?.showThumbnails ? 'Yes' : 'No'}</p>
                              <p><strong>Snippets:</strong> {config.displaySettings?.showSnippets ? 'Yes' : 'No'}</p>
                              <p><strong>Highlight:</strong> {config.displaySettings?.highlightMatches ? 'Yes' : 'No'}</p>
                            </div>
                          </div>
                          <div className="p-4 border rounded">
                            <h4 className="font-semibold mb-2">Features</h4>
                            <div className="flex flex-wrap gap-2">
                              {config.features?.autocomplete && <Badge>Autocomplete</Badge>}
                              {config.features?.spellcheck && <Badge>Spell Check</Badge>}
                              {config.features?.facetedSearch && <Badge>Faceted Search</Badge>}
                              {config.features?.instantSearch && <Badge>Instant Search</Badge>}
                              {config.features?.voiceSearch && <Badge>Voice Search</Badge>}
                              {!Object.values(config.features || {}).some(Boolean) && (
                                <span className="text-gray-500">No features enabled</span>
                              )}
                            </div>
                          </div>
                          <div className="p-4 border rounded">
                            <h4 className="font-semibold mb-2">Theme</h4>
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <div
                                  className="w-8 h-8 rounded border"
                                  style={{ backgroundColor: config.theme?.primaryColor || '#3b82f6' }}
                                  title="Primary Color"
                                />
                                <div
                                  className="w-8 h-8 rounded border"
                                  style={{ backgroundColor: config.theme?.secondaryColor || '#64748b' }}
                                  title="Secondary Color"
                                />
                              </div>
                              <p className="text-sm"><strong>Font:</strong> {config.theme?.fontFamily?.split(',')[0] || 'Inter'}</p>
                            </div>
                          </div>
                        </div>
                      )
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Tab>

        {/* Preview Tab */}
        <Tab label="Preview">
          <FunctionField
            render={(record: any) => (
              <WidgetPreview config={record.configuration || {}} />
            )}
          />
        </Tab>

        {/* Embed Code Tab */}
        <Tab label="Embed Code">
          <FunctionField
            render={(record: any) => (
              <EmbedCodeDisplay config={record.configuration || {}} />
            )}
          />
        </Tab>

        {/* Analytics Tab */}
        <Tab label="Analytics">
          <FunctionField
            render={(record: any) => (
              <AnalyticsDashboard widgetId={record.id} />
            )}
          />
        </Tab>
      </TabbedShowLayout>
    </Show>
  )
}
