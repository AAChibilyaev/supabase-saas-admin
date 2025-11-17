import { Grid, Switch, FormControlLabel } from '@mui/material'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import {
  Zap,
  Mic,
  Filter,
  Search,
  CheckCircle2,
  Sparkles
} from 'lucide-react'

interface FeatureTogglesProps {
  config: {
    autocomplete: boolean
    spellcheck: boolean
    facetedSearch: boolean
    instantSearch: boolean
    voiceSearch: boolean
  }
  onChange: (updates: any) => void
}

interface FeatureConfig {
  key: keyof FeatureTogglesProps['config']
  label: string
  description: string
  icon: any
  badge?: string
  premium?: boolean
}

const FEATURES: FeatureConfig[] = [
  {
    key: 'instantSearch',
    label: 'Instant Search',
    description: 'Search results update as users type, providing immediate feedback',
    icon: Zap,
  },
  {
    key: 'autocomplete',
    label: 'Autocomplete',
    description: 'Show search suggestions as users type to help them find what they need',
    icon: Sparkles,
  },
  {
    key: 'spellcheck',
    label: 'Spell Check',
    description: 'Automatically correct typos and suggest alternative spellings',
    icon: CheckCircle2,
  },
  {
    key: 'facetedSearch',
    label: 'Faceted Search',
    description: 'Enable filtering by categories, tags, and other attributes',
    icon: Filter,
    badge: 'Popular',
  },
  {
    key: 'voiceSearch',
    label: 'Voice Search',
    description: 'Allow users to search using voice input (browser support required)',
    icon: Mic,
    badge: 'Beta',
    premium: true,
  },
]

export const FeatureToggles = ({ config, onChange }: FeatureTogglesProps) => {
  const handleToggle = (key: keyof FeatureTogglesProps['config']) => {
    onChange({ [key]: !config[key] })
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader>
            <CardTitle>Widget Features</CardTitle>
            <CardDescription>
              Enable or disable features to customize your search widget experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                const isEnabled = config[feature.key]

                return (
                  <div
                    key={feature.key}
                    className={`p-4 border rounded-lg transition-all ${
                      isEnabled
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`w-5 h-5 ${
                            isEnabled ? 'text-blue-600' : 'text-gray-400'
                          }`}
                        />
                        <h4 className="font-semibold">{feature.label}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {feature.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {feature.badge}
                          </Badge>
                        )}
                        {feature.premium && (
                          <Badge className="text-xs bg-purple-100 text-purple-800">
                            Premium
                          </Badge>
                        )}
                        <Switch
                          checked={isEnabled}
                          onChange={() => handleToggle(feature.key)}
                          color="primary"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader>
            <CardTitle>Feature Summary</CardTitle>
            <CardDescription>
              Overview of enabled features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-medium">Total Features Available</span>
                <Badge>{FEATURES.length}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                <span className="font-medium">Features Enabled</span>
                <Badge className="bg-blue-600">
                  {Object.values(config).filter(Boolean).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <span className="font-medium">Performance Impact</span>
                <Badge className="bg-green-600">
                  {Object.values(config).filter(Boolean).length <= 3 ? 'Low' : 'Medium'}
                </Badge>
              </div>
            </div>

            {Object.values(config).filter(Boolean).length === 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Tip:</strong> Enable at least one feature to provide a better search
                  experience for your users. We recommend starting with Instant Search and
                  Autocomplete.
                </p>
              </div>
            )}

            {config.voiceSearch && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
                <p className="text-sm text-purple-800">
                  <strong>Note:</strong> Voice search requires HTTPS and browser support.
                  It may not work in all browsers or environments.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
