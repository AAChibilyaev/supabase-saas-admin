import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { useToast } from '../hooks/use-toast'
import type { EmailPreferences } from '../services/email'
import { getEmailPreferences, updateEmailPreferences } from '../services/email'
import { Switch } from './ui/switch'
import { supabase } from '../lib/supabase'

export function EmailPreferencesSettings() {
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      const prefs = await getEmailPreferences(user.id)
      setPreferences(prefs)
    } catch (error) {
      console.error('Failed to load email preferences:', error)
      toast({
        title: 'Error',
        description: 'Failed to load email preferences',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadPreferences()
  }, [loadPreferences])

  const handleSave = async () => {
    if (!preferences) return

    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      await updateEmailPreferences(user.id, {
        notifications: preferences.notifications,
        marketing: preferences.marketing,
        usageAlerts: preferences.usageAlerts,
        billing: preferences.billing,
        systemAlerts: preferences.systemAlerts,
      })

      toast({
        title: 'Success',
        description: 'Email preferences updated successfully',
      })
    } catch (error) {
      console.error('Failed to update email preferences:', error)
      toast({
        title: 'Error',
        description: 'Failed to update email preferences',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: keyof Omit<EmailPreferences, 'userId'>) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>Loading preferences...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>Failed to load preferences</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Preferences</CardTitle>
        <CardDescription>
          Manage your email notification preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Notifications */}
          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1">
              <Label htmlFor="notifications" className="text-base font-medium">
                Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about important updates and activities
              </p>
            </div>
            <Switch
              id="notifications"
              checked={preferences.notifications}
              onCheckedChange={() => handleToggle('notifications')}
            />
          </div>

          {/* Marketing */}
          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1">
              <Label htmlFor="marketing" className="text-base font-medium">
                Marketing
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive newsletters, product updates, and promotional content
              </p>
            </div>
            <Switch
              id="marketing"
              checked={preferences.marketing}
              onCheckedChange={() => handleToggle('marketing')}
            />
          </div>

          {/* Usage Alerts */}
          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1">
              <Label htmlFor="usageAlerts" className="text-base font-medium">
                Usage Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when you're approaching usage limits
              </p>
            </div>
            <Switch
              id="usageAlerts"
              checked={preferences.usageAlerts}
              onCheckedChange={() => handleToggle('usageAlerts')}
            />
          </div>

          {/* Billing */}
          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1">
              <Label htmlFor="billing" className="text-base font-medium">
                Billing
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive invoices, payment confirmations, and billing alerts
              </p>
            </div>
            <Switch
              id="billing"
              checked={preferences.billing}
              onCheckedChange={() => handleToggle('billing')}
            />
          </div>

          {/* System Alerts */}
          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1">
              <Label htmlFor="systemAlerts" className="text-base font-medium">
                System Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Critical system notifications and maintenance updates
              </p>
            </div>
            <Switch
              id="systemAlerts"
              checked={preferences.systemAlerts}
              onCheckedChange={() => handleToggle('systemAlerts')}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
