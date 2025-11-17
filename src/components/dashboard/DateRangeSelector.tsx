import { useState } from 'react'
import { Button } from '../ui/button'
import { Calendar } from 'lucide-react'
import { subDays, subMonths, format } from 'date-fns'

export interface DateRange {
  from: Date
  to: Date
}

interface DateRangeSelectorProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const presetRanges = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 6 months', months: 6 },
  { label: 'Last year', months: 12 }
]

export const DateRangeSelector = ({ value, onChange }: DateRangeSelectorProps) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('Last 30 days')

  const handlePresetClick = (preset: typeof presetRanges[0]) => {
    const to = new Date()
    const from = preset.days
      ? subDays(to, preset.days)
      : subMonths(to, preset.months!)

    setSelectedPreset(preset.label)
    onChange({ from, to })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Date Range:</span>
      {presetRanges.map((preset) => (
        <Button
          key={preset.label}
          variant={selectedPreset === preset.label ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick(preset)}
        >
          {preset.label}
        </Button>
      ))}
      <span className="text-xs text-muted-foreground ml-2">
        {format(value.from, 'MMM dd, yyyy')} - {format(value.to, 'MMM dd, yyyy')}
      </span>
    </div>
  )
}
