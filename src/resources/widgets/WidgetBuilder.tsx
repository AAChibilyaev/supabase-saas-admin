import { useState, useEffect } from 'react'
import {
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  BooleanInput,
  required,
  useNotify,
  useRedirect,
  useGetList,
  TabbedForm,
  FormTab,
  SaveButton,
  Toolbar,
} from 'react-admin'
import { Box, Grid, Paper, Typography } from '@mui/material'
import { ThemeEditor } from './components/ThemeEditor'
import { FeatureToggles } from './components/FeatureToggles'
import { EmbedCodeDisplay } from './components/EmbedCodeDisplay'
import { WidgetPreview } from './WidgetPreview'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { Input } from '../../components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'

// Widget configuration type
interface WidgetConfig {
  searchSettings: {
    placeholder: string
    defaultQuery: string
    collection: string
    searchFields: string[]
    resultsPerPage: number
    enableFilters: boolean
    enableSorting: boolean
  }
  displaySettings: {
    showThumbnails: boolean
    showSnippets: boolean
    highlightMatches: boolean
    layout: 'list' | 'grid' | 'compact'
  }
  theme: {
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    borderRadius: string
    spacing: string
  }
  features: {
    autocomplete: boolean
    spellcheck: boolean
    facetedSearch: boolean
    instantSearch: boolean
    voiceSearch: boolean
  }
}

// Widget templates
const WIDGET_TEMPLATES = [
  {
    id: 'basic-search',
    name: 'Basic Search',
    description: 'Simple search box with results',
    type: 'search',
    config: {
      searchSettings: {
        placeholder: 'Search...',
        defaultQuery: '',
        collection: '',
        searchFields: ['title', 'content'],
        resultsPerPage: 10,
        enableFilters: false,
        enableSorting: false,
      },
      displaySettings: {
        showThumbnails: false,
        showSnippets: true,
        highlightMatches: true,
        layout: 'list' as const,
      },
      theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        fontFamily: 'Inter, sans-serif',
        borderRadius: '0.5rem',
        spacing: '1rem',
      },
      features: {
        autocomplete: false,
        spellcheck: false,
        facetedSearch: false,
        instantSearch: true,
        voiceSearch: false,
      },
    },
  },
  {
    id: 'faceted-search',
    name: 'Faceted Search',
    description: 'Search with filters and facets',
    type: 'faceted-search',
    config: {
      searchSettings: {
        placeholder: 'Search with filters...',
        defaultQuery: '',
        collection: '',
        searchFields: ['title', 'content', 'tags'],
        resultsPerPage: 20,
        enableFilters: true,
        enableSorting: true,
      },
      displaySettings: {
        showThumbnails: true,
        showSnippets: true,
        highlightMatches: true,
        layout: 'grid' as const,
      },
      theme: {
        primaryColor: '#8b5cf6',
        secondaryColor: '#64748b',
        fontFamily: 'Inter, sans-serif',
        borderRadius: '0.5rem',
        spacing: '1rem',
      },
      features: {
        autocomplete: true,
        spellcheck: true,
        facetedSearch: true,
        instantSearch: true,
        voiceSearch: false,
      },
    },
  },
  {
    id: 'autocomplete',
    name: 'Autocomplete',
    description: 'Search with autocomplete suggestions',
    type: 'autocomplete',
    config: {
      searchSettings: {
        placeholder: 'Start typing...',
        defaultQuery: '',
        collection: '',
        searchFields: ['title', 'keywords'],
        resultsPerPage: 5,
        enableFilters: false,
        enableSorting: false,
      },
      displaySettings: {
        showThumbnails: false,
        showSnippets: false,
        highlightMatches: true,
        layout: 'compact' as const,
      },
      theme: {
        primaryColor: '#10b981',
        secondaryColor: '#64748b',
        fontFamily: 'Inter, sans-serif',
        borderRadius: '0.5rem',
        spacing: '0.5rem',
      },
      features: {
        autocomplete: true,
        spellcheck: true,
        facetedSearch: false,
        instantSearch: true,
        voiceSearch: false,
      },
    },
  },
]

const WidgetBuilderToolbar = (props: any) => (
  <Toolbar {...props}>
    <SaveButton />
  </Toolbar>
)

export const WidgetBuilder = () => {
  const notify = useNotify()
  const redirect = useRedirect()
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>(WIDGET_TEMPLATES[0].config)
  const [selectedTemplate, setSelectedTemplate] = useState(WIDGET_TEMPLATES[0].id)

  // Get available collections
  const { data: collections } = useGetList('typesense-collections', {
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'name', order: 'ASC' },
  })

  const collectionChoices = collections?.map((col: any) => ({
    id: col.name,
    name: col.name,
  })) || []

  const handleTemplateChange = (templateId: string) => {
    const template = WIDGET_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setWidgetConfig(template.config)
    }
  }

  const handleConfigChange = (section: keyof WidgetConfig, updates: any) => {
    setWidgetConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates,
      },
    }))
  }

  return (
    <Edit>
      <TabbedForm toolbar={<WidgetBuilderToolbar />}>
        {/* Basic Configuration Tab */}
        <FormTab label="Basic Settings">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader>
                  <CardTitle>Widget Information</CardTitle>
                  <CardDescription>
                    Basic details about your search widget
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TextInput
                    source="name"
                    label="Widget Name"
                    validate={[required()]}
                    fullWidth
                  />
                  <TextInput
                    source="description"
                    label="Description"
                    multiline
                    rows={3}
                    fullWidth
                  />
                  <SelectInput
                    source="type"
                    label="Widget Type"
                    choices={[
                      { id: 'search', name: 'Search Widget' },
                      { id: 'faceted-search', name: 'Faceted Search' },
                      { id: 'autocomplete', name: 'Autocomplete' },
                      { id: 'instant-search', name: 'Instant Search' },
                    ]}
                    validate={[required()]}
                    fullWidth
                  />
                  <BooleanInput
                    source="is_active"
                    label="Active"
                    defaultValue={true}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Start Templates</CardTitle>
                  <CardDescription>
                    Choose a pre-configured template to get started
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {WIDGET_TEMPLATES.map(template => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleTemplateChange(template.id)}
                    >
                      <h4 className="font-semibold">{template.name}</h4>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </FormTab>

        {/* Search Settings Tab */}
        <FormTab label="Search Settings">
          <Card>
            <CardHeader>
              <CardTitle>Search Configuration</CardTitle>
              <CardDescription>
                Configure how search behaves in your widget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <SelectInput
                    source="configuration.searchSettings.collection"
                    label="Typesense Collection"
                    choices={collectionChoices}
                    validate={[required()]}
                    fullWidth
                  />
                  <TextInput
                    source="configuration.searchSettings.placeholder"
                    label="Search Placeholder"
                    defaultValue="Search..."
                    fullWidth
                  />
                  <TextInput
                    source="configuration.searchSettings.defaultQuery"
                    label="Default Query"
                    fullWidth
                  />
                  <TextInput
                    source="configuration.searchSettings.searchFields"
                    label="Search Fields (comma-separated)"
                    defaultValue="title,content"
                    fullWidth
                    helperText="Fields to search in"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextInput
                    source="configuration.searchSettings.resultsPerPage"
                    label="Results Per Page"
                    type="number"
                    defaultValue={10}
                    fullWidth
                  />
                  <BooleanInput
                    source="configuration.searchSettings.enableFilters"
                    label="Enable Filters"
                    defaultValue={false}
                  />
                  <BooleanInput
                    source="configuration.searchSettings.enableSorting"
                    label="Enable Sorting"
                    defaultValue={false}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </FormTab>

        {/* Features Tab */}
        <FormTab label="Features">
          <FeatureToggles
            config={widgetConfig.features}
            onChange={(updates) => handleConfigChange('features', updates)}
          />
        </FormTab>

        {/* Theme Tab */}
        <FormTab label="Theme & Styling">
          <ThemeEditor
            config={widgetConfig.theme}
            onChange={(updates) => handleConfigChange('theme', updates)}
          />
        </FormTab>

        {/* Display Settings Tab */}
        <FormTab label="Display">
          <Card>
            <CardHeader>
              <CardTitle>Display Options</CardTitle>
              <CardDescription>
                Control how search results are displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SelectInput
                source="configuration.displaySettings.layout"
                label="Layout"
                choices={[
                  { id: 'list', name: 'List View' },
                  { id: 'grid', name: 'Grid View' },
                  { id: 'compact', name: 'Compact View' },
                ]}
                defaultValue="list"
                fullWidth
              />
              <BooleanInput
                source="configuration.displaySettings.showThumbnails"
                label="Show Thumbnails"
                defaultValue={false}
              />
              <BooleanInput
                source="configuration.displaySettings.showSnippets"
                label="Show Snippets"
                defaultValue={true}
              />
              <BooleanInput
                source="configuration.displaySettings.highlightMatches"
                label="Highlight Matches"
                defaultValue={true}
              />
            </CardContent>
          </Card>
        </FormTab>

        {/* Preview Tab */}
        <FormTab label="Preview">
          <WidgetPreview config={widgetConfig} />
        </FormTab>

        {/* Embed Code Tab */}
        <FormTab label="Embed Code">
          <EmbedCodeDisplay config={widgetConfig} />
        </FormTab>
      </TabbedForm>
    </Edit>
  )
}
