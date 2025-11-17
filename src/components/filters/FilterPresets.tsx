import * as React from "react"
import { useListContext } from "react-admin"
import { Star, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface FilterPreset {
  id: string
  name: string
  filters: Record<string, any>
}

interface FilterPresetsProps {
  resource: string
}

export function FilterPresets({ resource }: FilterPresetsProps) {
  const { filterValues, setFilters } = useListContext()
  const [presets, setPresets] = React.useState<FilterPreset[]>([])
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [presetName, setPresetName] = React.useState("")
  const storageKey = `filter-presets-${resource}`

  // Load presets from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setPresets(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Failed to load filter presets:", error)
    }
  }, [storageKey])

  // Save presets to localStorage
  const savePresets = (newPresets: FilterPreset[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newPresets))
      setPresets(newPresets)
    } catch (error) {
      console.error("Failed to save filter presets:", error)
    }
  }

  const handleSavePreset = () => {
    if (!presetName.trim()) return

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: { ...filterValues }
    }

    savePresets([...presets, newPreset])
    setPresetName("")
    setDialogOpen(false)
  }

  const handleApplyPreset = (preset: FilterPreset) => {
    setFilters(preset.filters, [])
  }

  const handleDeletePreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    savePresets(presets.filter(p => p.id !== presetId))
  }

  const hasActiveFilters = Object.keys(filterValues).length > 0

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Star className="h-4 w-4" />
            Filter Presets
            {presets.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {presets.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[250px]">
          <DropdownMenuLabel>Saved Filters</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {presets.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No saved presets yet
            </div>
          ) : (
            presets.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="flex-1">{preset.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => handleDeletePreset(preset.id, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDialogOpen(true)}
            disabled={!hasActiveFilters}
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            Save Current Filters
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
            <DialogDescription>
              Give your filter preset a name to save it for later use.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g., Active Pro Tenants"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSavePreset()
                  }
                }}
              />
            </div>
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium mb-2">Current Filters:</p>
              <div className="space-y-1">
                {Object.entries(filterValues).map(([key, value]) => (
                  <div key={key} className="text-xs text-muted-foreground">
                    <span className="font-medium">{key}:</span>{" "}
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
