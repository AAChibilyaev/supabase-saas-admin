/**
 * Plan Selector Component
 * Issue #28: Stripe Billing & Subscription Management
 *
 * Displays available billing plans with comparison and selection
 */

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { BillingPlan, UserSubscription } from '@/types/billing'
import { formatCurrency, formatInterval } from '@/lib/stripe'
import { createCheckoutSession } from '@/utils/billing'

interface PlanSelectorProps {
  plans: BillingPlan[]
  currentSubscription?: UserSubscription | null
  onPlanSelected?: (plan: BillingPlan) => void
}

export function PlanSelector({ plans, currentSubscription, onPlanSelected }: PlanSelectorProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSelectPlan = async (plan: BillingPlan) => {
    try {
      setLoading(plan.id)

      // Get current URL for success/cancel redirects
      const currentUrl = window.location.origin
      const successUrl = `${currentUrl}/billing/success`
      const cancelUrl = `${currentUrl}/billing`

      // Create checkout session
      const { url } = await createCheckoutSession(
        plan.stripe_price_id,
        successUrl,
        cancelUrl,
        plan.trial_period_days > 0 ? plan.trial_period_days : undefined
      )

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      }

      onPlanSelected?.(plan)
    } catch (error) {
      console.error('Error selecting plan:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const isCurrentPlan = (plan: BillingPlan) => {
    return currentSubscription?.stripe_price_id === plan.stripe_price_id
  }

  const renderFeatures = (features: Record<string, boolean | string | number>) => {
    return Object.entries(features)
      .filter(([_, value]) => value !== false)
      .map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
        return (
          <li key={key} className="flex items-start gap-2">
            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">
              {label}
              {typeof value === 'string' || typeof value === 'number' ? `: ${value}` : ''}
            </span>
          </li>
        )
      })
  }

  const renderLimits = (plan: BillingPlan) => {
    const limits = []

    if (plan.max_documents !== null) {
      limits.push(`${plan.max_documents.toLocaleString()} documents`)
    } else {
      limits.push('Unlimited documents')
    }

    if (plan.max_storage_gb !== null) {
      limits.push(`${plan.max_storage_gb} GB storage`)
    } else {
      limits.push('Unlimited storage')
    }

    if (plan.max_api_calls_per_month !== null) {
      limits.push(`${plan.max_api_calls_per_month.toLocaleString()} API calls/month`)
    } else {
      limits.push('Unlimited API calls')
    }

    if (plan.max_users !== null) {
      limits.push(`${plan.max_users} users`)
    } else {
      limits.push('Unlimited users')
    }

    return limits
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((plan) => {
        const isCurrent = isCurrentPlan(plan)
        const isLoading = loading === plan.id

        return (
          <Card
            key={plan.id}
            className={`relative ${plan.is_featured ? 'border-primary shadow-lg' : ''}`}
          >
            {plan.is_featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="default">Most Popular</Badge>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <div className="text-4xl font-bold">
                  {formatCurrency(plan.price_amount, plan.currency)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatInterval(plan.interval, plan.interval_count)}
                </div>
                {plan.trial_period_days > 0 && (
                  <div className="text-sm text-primary mt-1">
                    {plan.trial_period_days}-day free trial
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Includes:</h4>
                <ul className="space-y-2">
                  {renderLimits(plan).map((limit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{limit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {Object.keys(plan.features).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Features:</h4>
                  <ul className="space-y-2">{renderFeatures(plan.features)}</ul>
                </div>
              )}
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={isCurrent ? 'outline' : plan.is_featured ? 'default' : 'secondary'}
                disabled={isCurrent || isLoading}
                onClick={() => handleSelectPlan(plan)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isCurrent ? (
                  'Current Plan'
                ) : (
                  'Select Plan'
                )}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
