/**
 * Security Activity Component
 * Displays recent security-related activities and sessions
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { Activity, AlertCircle, Monitor, Smartphone, Globe } from 'lucide-react'
import { supabaseClient } from '../../providers/supabaseClient'

interface SessionInfo {
  id: string
  created_at: string
  ip_address?: string
  user_agent?: string
  current?: boolean
}

export function SecurityActivity() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSession, setCurrentSession] = useState<SessionInfo | null>(null)
  const [lastSignIn, setLastSignIn] = useState<string | null>(null)

  useEffect(() => {
    loadSecurityActivity()
  }, [])

  const loadSecurityActivity = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabaseClient.auth.getUser()

      if (!user) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      // Get last sign in
      if (user.last_sign_in_at) {
        setLastSignIn(user.last_sign_in_at)
      }

      // Get current session info
      const { data: session } = await supabaseClient.auth.getSession()

      if (session.session) {
        setCurrentSession({
          id: session.session.access_token.substring(0, 8) + '...',
          created_at: session.session.created_at || new Date().toISOString(),
          current: true,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security activity')
    } finally {
      setLoading(false)
    }
  }

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />
    if (userAgent.toLowerCase().includes('mobile')) {
      return <Smartphone className="h-4 w-4" />
    }
    return <Monitor className="h-4 w-4" />
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading activity...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
          <CardDescription>
            View your recent security-related activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {lastSignIn && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Last Sign In</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(lastSignIn).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge>Successful</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Active Sessions</CardTitle>
          </div>
          <CardDescription>
            Manage your active login sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentSession && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getDeviceIcon(currentSession.user_agent)}
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">
                      Started {new Date(currentSession.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
              {currentSession.ip_address && (
                <p className="text-sm text-muted-foreground">
                  IP: {currentSession.ip_address}
                </p>
              )}
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              If you notice any suspicious activity, change your password immediately and
              review your MFA settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <div className="mt-0.5 h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <span>Use a strong, unique password that you don't use anywhere else</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-0.5 h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <span>Enable multi-factor authentication for enhanced security</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-0.5 h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <span>Generate and save recovery codes in a secure location</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-0.5 h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <span>Review your active sessions regularly</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-0.5 h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <span>Never share your password or recovery codes with anyone</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
