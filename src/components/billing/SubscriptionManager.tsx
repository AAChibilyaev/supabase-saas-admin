/**
 * Subscription Manager Component
 * Issue #28: Stripe Billing & Subscription Management
 *
 * Displays current subscription details and management options
 */

import { useState } from 'react'
import { Calendar, CreditCard, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { UserSubscription, BillingPlan } from '@/types/billing'
import {
  formatCurrency,
  formatInterval,
  getSubscriptionStatusColor,
  getSubscriptionStatusLabel,
  getDaysUntilTrialEnd,
  isTrialEndingSoon,
} from '@/lib/stripe'
import { createCustomerPortalSession } from '@/utils/billing'

interface SubscriptionManagerProps {
  subscription: UserSubscription | null
  plan: BillingPlan | null
}

export function SubscriptionManager({ subscription, plan }: SubscriptionManagerProps) {
  const [loading, setLoading] = useState(false)

  const handleManageSubscription = async () => {
    try {
      setLoading(true)
      const returnUrl = window.location.href
      const { url } = await createCustomerPortalSession(returnUrl)

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
      alert('Failed to open customer portal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!subscription || !plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You don't have an active subscription. Choose a plan to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const statusColor = getSubscriptionStatusColor(subscription.status)
  const statusLabel = getSubscriptionStatusLabel(subscription.status)
  const periodEnd = new Date(subscription.current_period_end)
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null
  const isTrialing = subscription.status === 'trialing'
  const showTrialWarning = trialEnd && isTrialEndingSoon(trialEnd)
  const daysUntilTrialEnd = trialEnd ? getDaysUntilTrialEnd(trialEnd) : 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{plan.name} Plan</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </div>
            <Badge
              variant={
                statusColor === 'green'
                  ? 'default'
                  : statusColor === 'red'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Trial Warning */}
          {isTrialing && showTrialWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Trial Ending Soon</AlertTitle>
              <AlertDescription>
                Your trial ends in {daysUntilTrialEnd} days. Add a payment method to continue your
                subscription.
              </AlertDescription>
            </Alert>
          )}

          {/* Cancellation Warning */}
          {subscription.cancel_at_period_end && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Subscription Canceled</AlertTitle>
              <AlertDescription>
                Your subscription will end on {periodEnd.toLocaleDateString()}. You can reactivate
                it anytime before then.
              </AlertDescription>
            </Alert>
          )}

          {/* Pricing */}
          <div>
            <div className="text-3xl font-bold">
              {formatCurrency(plan.price_amount, plan.currency)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatInterval(plan.interval, plan.interval_count)}
            </div>
          </div>

          {/* Billing Period */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <div className="font-medium">
                {isTrialing ? 'Trial Period' : 'Current Billing Period'}
              </div>
              <div className="text-sm text-muted-foreground">
                {isTrialing && trialEnd ? (
                  <>
                    Ends on {trialEnd.toLocaleDateString()} ({daysUntilTrialEnd} days remaining)
                  </>
                ) : (
                  <>
                    Started {new Date(subscription.current_period_start).toLocaleDateString()}
                    <br />
                    Renews on {periodEnd.toLocaleDateString()}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          {subscription.default_payment_method && (
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">Payment Method</div>
                <div className="text-sm text-muted-foreground">
                  Card ending in {subscription.default_payment_method.slice(-4)}
                </div>
              </div>
            </div>
          )}

          {/* Plan Limits */}
          <div>
            <h4 className="font-semibold mb-2">Plan Limits</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Documents</div>
                <div className="font-medium">
                  {plan.max_documents ? plan.max_documents.toLocaleString() : 'Unlimited'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Storage</div>
                <div className="font-medium">
                  {plan.max_storage_gb ? `${plan.max_storage_gb} GB` : 'Unlimited'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">API Calls</div>
                <div className="font-medium">
                  {plan.max_api_calls_per_month
                    ? `${plan.max_api_calls_per_month.toLocaleString()}/mo`
                    : 'Unlimited'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Users</div>
                <div className="font-medium">
                  {plan.max_users ? plan.max_users : 'Unlimited'}
                </div>
              </div>
            </div>
          </div>

          {/* Management Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleManageSubscription}
              disabled={loading}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage Subscription
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
