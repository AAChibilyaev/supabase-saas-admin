import { Grid } from '@mui/material'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'
import { Slider } from '../../../components/ui/slider'

interface ThemeEditorProps {
  config: {
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    borderRadius: string
    spacing: string
  }
  onChange: (updates: ThemeEditorProps['config']) => void
}

const FONT_FAMILIES = [
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Courier New, monospace', label: 'Courier New' },
]

const PRESET_COLORS = [
  { name: 'Blue', primary: '#3b82f6', secondary: '#64748b' },
  { name: 'Purple', primary: '#8b5cf6', secondary: '#64748b' },
  { name: 'Green', primary: '#10b981', secondary: '#64748b' },
  { name: 'Orange', primary: '#f59e0b', secondary: '#64748b' },
  { name: 'Red', primary: '#ef4444', secondary: '#64748b' },
  { name: 'Pink', primary: '#ec4899', secondary: '#64748b' },
  { name: 'Indigo', primary: '#6366f1', secondary: '#64748b' },
  { name: 'Teal', primary: '#14b8a6', secondary: '#64748b' },
]

export const ThemeEditor = ({ config, onChange }: ThemeEditorProps) => {
  const handleColorPresetClick = (preset: { primary: string; secondary: string }) => {
    onChange({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      fontFamily: config.fontFamily,
      borderRadius: config.borderRadius,
      spacing: config.spacing,
    })
  }

  const handleBorderRadiusChange = (value: number[]) => {
    onChange({ borderRadius: `${value[0]}rem`, fontFamily: config.fontFamily, spacing: config.spacing, primaryColor: config.primaryColor, secondaryColor: config.secondaryColor })
  }

  const handleSpacingChange = (value: number[]) => {
    onChange({ spacing: `${value[0]}rem`, fontFamily: config.fontFamily, borderRadius: config.borderRadius, primaryColor: config.primaryColor, secondaryColor: config.secondaryColor })
  }

  const getBorderRadiusValue = () => {
    const match = config.borderRadius.match(/(\d+\.?\d*)/)
    return match ? parseFloat(match[1]) : 0.5
  }

  const getSpacingValue = () => {
    const match = config.spacing.match(/(\d+\.?\d*)/)
    return match ? parseFloat(match[1]) : 1
  }

  return (
    <Grid container spacing={3}>
      <Grid size={12} columns={6} component="section">
        <Card>
          <CardHeader>
            <CardTitle>Color Scheme</CardTitle>
            <CardDescription>
              Choose colors that match your brand
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Color Presets */}
            <div>
              <Label className="mb-2 block">Quick Color Presets</Label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.name}
                    className="h-12 rounded-md border-2 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: preset.primary }}
                    onClick={() => handleColorPresetClick(preset)}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            {/* Primary Color */}
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => onChange({ primaryColor: e.target.value, secondaryColor: config.secondaryColor, fontFamily: config.fontFamily, borderRadius: config.borderRadius, spacing: config.spacing })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={config.primaryColor}
                  onChange={(e) => onChange({ primaryColor: e.target.value, secondaryColor: config.secondaryColor, fontFamily: config.fontFamily, borderRadius: config.borderRadius, spacing: config.spacing })}
                  className="flex-1"
                  placeholder="#3b82f6"
                />
              </div>
              <p className="text-xs text-gray-500">
                Used for buttons, links, and highlights
              </p>
            </div>

            {/* Secondary Color */}
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={config.secondaryColor}
                  onChange={(e) => onChange({ secondaryColor: e.target.value, primaryColor: config.primaryColor, fontFamily: config.fontFamily, borderRadius: config.borderRadius, spacing: config.spacing })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={config.secondaryColor}
                  onChange={(e) => onChange({ secondaryColor: e.target.value, primaryColor: config.primaryColor, fontFamily: config.fontFamily, borderRadius: config.borderRadius, spacing: config.spacing })}
                  className="flex-1"
                  placeholder="#64748b"
                />
              </div>
              <p className="text-xs text-gray-500">
                Used for borders, secondary text, and backgrounds
              </p>
            </div>

            {/* Preview */}
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-semibold mb-2">Color Preview</p>
              <div className="flex gap-2">
                <div
                  className="flex-1 h-16 rounded flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  Primary
                </div>
                <div
                  className="flex-1 h-16 rounded flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: config.secondaryColor }}
                >
                  Secondary
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={12} columns={6} component="div">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Typography & Spacing</CardTitle>
            <CardDescription>
              Adjust fonts and spacing for your widget
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Font Family */}
            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font Family</Label>
              <select
                id="fontFamily"
                value={config.fontFamily}
                onChange={(e) => onChange({ fontFamily: e.target.value, primaryColor: config.primaryColor, secondaryColor: config.secondaryColor, borderRadius: config.borderRadius, spacing: config.spacing })}
                className="w-full border rounded px-3 py-2"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
              <div
                className="p-3 border rounded"
                style={{ fontFamily: config.fontFamily }}
              >
                <p className="text-lg font-semibold">The quick brown fox</p>
                <p className="text-sm">jumps over the lazy dog</p>
              </div>
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
              <Label htmlFor="borderRadius">
                Border Radius: {config.borderRadius}
              </Label>
              <Slider
                id="borderRadius"
                min={0}
                max={2}
                step={0.1}
                value={[getBorderRadiusValue()]}
                onValueChange={handleBorderRadiusChange}
                className="w-full"
              />
              <div className="grid grid-cols-3 gap-2">
                <div
                  className="h-16 bg-blue-500"
                  style={{ borderRadius: config.borderRadius }}
                />
                <div
                  className="h-16 bg-purple-500"
                  style={{ borderRadius: config.borderRadius }}
                />
                <div
                  className="h-16 bg-green-500"
                  style={{ borderRadius: config.borderRadius }}
                />
              </div>
            </div>

            {/* Spacing */}
            <div className="space-y-2">
              <Label htmlFor="spacing">
                Spacing/Padding: {config.spacing}
              </Label>
              <Slider
                id="spacing"
                min={0.25}
                max={3}
                step={0.25}
                value={[getSpacingValue()]}
                onValueChange={handleSpacingChange}
                className="w-full"
              />
              <div className="border rounded">
                <div
                  className="bg-blue-100 border-l-4 border-blue-500"
                  style={{ padding: config.spacing }}
                >
                  <p className="text-sm">
                    This is a preview of the spacing you selected
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={12} columns={12} component="div">
        <Card>
          <CardHeader>
            <CardTitle>Custom CSS</CardTitle>
            <CardDescription>
              Add custom CSS to further customize your widget (advanced)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full h-32 font-mono text-sm border rounded p-3"
              placeholder="/* Add your custom CSS here */
.widget-search-input {
  /* Custom styles */
}

.widget-result-item {
  /* Custom styles */
}"
            />
            <p className="text-xs text-gray-500 mt-2">
              Custom CSS will be applied to the widget iframe. Use specific class names to
              target widget elements.
            </p>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
