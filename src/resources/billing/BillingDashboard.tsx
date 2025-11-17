/**
 * Billing Dashboard Resource
 * Issue #28: Stripe Billing & Subscription Management
 *
 * Main billing and subscription management page
 */

import { useState, useEffect } from 'react'
import { Loader2, CreditCard, Bell, TrendingUp } from 'lucide-react'
import { Title } from 'react-admin'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlanSelector } from '@/components/billing/PlanSelector'
import { SubscriptionManager } from '@/components/billing/SubscriptionManager'
import { InvoiceList } from '@/components/billing/InvoiceList'
import { UsageMeters } from '@/components/billing/UsageMeters'
import { fetchBillingOverview, acknowledgeBillingAlert } from '@/utils/billing'
import type { BillingPlan, UserSubscription, StripeInvoice, BillingAlert, TenantUsage } from '@/types/billing'
import { supabase } from '@/lib/supabase'

export function BillingDashboard() {
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [plan, setPlan] = useState<BillingPlan | null>(null)
  const [availablePlans, setAvailablePlans] = useState<BillingPlan[]>([])
  const [invoices, setInvoices] = useState<StripeInvoice[]>([])
  const [alerts, setAlerts] = useState<BillingAlert[]>([])
  const [usage, setUsage] = useState<TenantUsage | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        return
      }

      // Get user's tenant
      const { data: userTenant } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (!userTenant) {
        setError('No tenant found')
        return
      }

      // Fetch all billing data
      const data = await fetchBillingOverview(user.id, userTenant.tenant_id)

      setSubscription(data.subscription)
      setPlan(data.plan)
      setAvailablePlans(data.availablePlans)
      setInvoices(data.invoices)
      setAlerts(data.alerts)
      setUsage(data.usage)
    } catch (err) {
      console.error('Error loading billing data:', err)
      setError('Failed to load billing data')
    } finally {
      setLoading(false)
    }
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await acknowledgeBillingAlert(alertId, user.id)
      setAlerts(alerts.filter((alert) => alert.id !== alertId))
    } catch (err) {
      console.error('Error acknowledging alert:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Title title="Billing & Subscriptions" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage your subscription, view invoices, and track usage
          </p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={alert.severity === 'error' || alert.severity === 'critical' ? 'destructive' : 'default'}
            >
              <Bell className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-2">
                {alert.title}
                <Badge variant="outline">
                  {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                </Badge>
              </AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{alert.message}</span>
                <button
                  onClick={() => handleAcknowledgeAlert(alert.id)}
                  className="text-sm underline hover:no-underline"
                >
                  Dismiss
                </button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{plan?.name || 'Free'}</div>
                <p className="text-xs text-muted-foreground">
                  {subscription?.status === 'active' ? 'Active subscription' : 'No active subscription'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subscription?.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : '-'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {subscription ? 'Renews automatically' : 'No active subscription'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usage</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usage?.documents_count.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Documents this period
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SubscriptionManager subscription={subscription} plan={plan} />
            <UsageMeters usage={usage} plan={plan} />
          </div>

          <InvoiceList invoices={invoices} />
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Plan</CardTitle>
              <CardDescription>
                Select the plan that best fits your needs. You can change or cancel anytime.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlanSelector
                plans={availablePlans}
                currentSubscription={subscription}
                onPlanSelected={() => {
                  // Reload data after plan selection
                  setTimeout(() => loadBillingData(), 1000)
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <InvoiceList invoices={invoices} />
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <UsageMeters usage={usage} plan={plan} />

          {usage && (
            <Card>
              <CardHeader>
                <CardTitle>Usage Details</CardTitle>
                <CardDescription>
                  Detailed breakdown of your current usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Documents</div>
                      <div className="text-2xl font-bold">{usage.documents_count.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Storage</div>
                      <div className="text-2xl font-bold">
                        {(usage.storage_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">API Calls</div>
                      <div className="text-2xl font-bold">{usage.api_calls_count.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Searches</div>
                      <div className="text-2xl font-bold">{usage.search_count.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
