/**
 * Security Settings Page
 * Main component for all security-related settings
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Shield, Key, LifeBuoy, Activity } from 'lucide-react'
import { MFASetup } from './MFASetup'
import { PasswordChange } from './PasswordChange'
import { AccountRecovery } from './AccountRecovery'
import { SecurityActivity } from './SecurityActivity'

export function SecuritySettings() {
  const [activeTab, setActiveTab] = useState('password')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
        <p className="text-muted-foreground">
          Manage your account security, password, and authentication methods
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Password
          </TabsTrigger>
          <TabsTrigger value="mfa" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            MFA
          </TabsTrigger>
          <TabsTrigger value="recovery" className="flex items-center gap-2">
            <LifeBuoy className="h-4 w-4" />
            Recovery
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="password" className="space-y-4">
          <PasswordChange />
        </TabsContent>

        <TabsContent value="mfa" className="space-y-4">
          <MFASetup />

          <Card>
            <CardHeader>
              <CardTitle>About Multi-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Multi-factor authentication (MFA) adds an extra layer of security to your account
                by requiring a second form of verification in addition to your password.
              </p>
              <p>
                We support TOTP (Time-based One-Time Password) authentication, which works with
                popular authenticator apps like:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Google Authenticator</li>
                <li>Authy</li>
                <li>Microsoft Authenticator</li>
                <li>1Password</li>
                <li>Any TOTP-compatible app</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recovery" className="space-y-4">
          <AccountRecovery />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <SecurityActivity />
        </TabsContent>
      </Tabs>
    </div>
  )
}
