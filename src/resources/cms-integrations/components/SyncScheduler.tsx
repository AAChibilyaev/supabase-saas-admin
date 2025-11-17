import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import type { SyncSchedule } from '../../../types/cms'

interface SyncSchedulerProps {
  schedule: SyncSchedule
  onChange: (schedule: SyncSchedule) => void
}

const SCHEDULE_TYPES = [
  { id: 'manual', name: 'Manual Only' },
  { id: 'interval', name: 'Fixed Interval' },
  { id: 'cron', name: 'Cron Expression' },
  { id: 'webhook', name: 'Webhook (Real-time)' }
]

const INTERVAL_PRESETS = [
  { value: 15, label: 'Every 15 minutes' },
  { value: 30, label: 'Every 30 minutes' },
  { value: 60, label: 'Every hour' },
  { value: 180, label: 'Every 3 hours' },
  { value: 360, label: 'Every 6 hours' },
  { value: 720, label: 'Every 12 hours' },
  { value: 1440, label: 'Daily' }
]

const CRON_PRESETS = [
  { value: '0 * * * *', label: 'Every hour' },
  { value: '0 */6 * * *', label: 'Every 6 hours' },
  { value: '0 0 * * *', label: 'Daily at midnight' },
  { value: '0 0 * * 0', label: 'Weekly on Sunday' },
  { value: '0 0 1 * *', label: 'Monthly on 1st' }
]

export const SyncScheduler = ({ schedule, onChange }: SyncSchedulerProps) => {
  const updateSchedule = (updates: Partial<SyncSchedule>) => {
    onChange({ ...schedule, ...updates })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sync Schedule</CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure when and how often to sync content
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Schedule Type</Label>
          <Select
            value={schedule.type}
            onValueChange={(value: any) => updateSchedule({ type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCHEDULE_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {schedule.type === 'interval' && (
          <div className="space-y-2">
            <Label>Sync Interval</Label>
            <Select
              value={String(schedule.interval || 60)}
              onValueChange={(value) => updateSchedule({ interval: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={String(preset.value)}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Custom interval: {schedule.interval || 60} minutes
            </p>
          </div>
        )}

        {schedule.type === 'cron' && (
          <div className="space-y-2">
            <Label>Cron Expression</Label>
            <Input
              value={schedule.cronExpression || ''}
              onChange={(e) => updateSchedule({ cronExpression: e.target.value })}
              placeholder="0 * * * *"
            />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Common patterns:</p>
              <div className="flex flex-wrap gap-2">
                {CRON_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateSchedule({ cronExpression: preset.value })}
                    className="text-xs px-2 py-1 rounded border hover:bg-accent"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {schedule.type === 'webhook' && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm">
              Webhook-based sync will trigger automatically when content changes in your CMS.
              Configure webhooks in the Webhook Setup section.
            </p>
          </div>
        )}

        {schedule.type === 'manual' && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm">
              Manual sync only. Use the "Sync Now" button to trigger syncs on demand.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
