/**
 * Usage Meters Component
 * Issue #28: Stripe Billing & Subscription Management
 *
 * Displays usage metrics and quota limits
 */

import { FileText, Database, Zap, Users, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { TenantUsage, BillingPlan } from '@/types/billing'
import { calculateUsagePercentage, getUsageColor, formatBytes, formatNumber } from '@/lib/stripe'

interface UsageMetersProps {
  usage: TenantUsage | null
  plan: BillingPlan | null
}

interface UsageMeterProps {
  icon: React.ReactNode
  label: string
  current: number
  limit: number | null
  formatter?: (value: number) => string
}

function UsageMeter({ icon, label, current, limit, formatter = formatNumber }: UsageMeterProps) {
  const percentage = calculateUsagePercentage(current, limit)
  const color = getUsageColor(percentage)

  const getProgressColor = () => {
    if (color === 'red') return 'bg-red-500'
    if (color === 'orange') return 'bg-orange-500'
    if (color === 'yellow') return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {formatter(current)} {limit !== null ? `/ ${formatter(limit)}` : ''}
        </span>
      </div>

      {limit !== null ? (
        <>
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentage}% used</span>
            {percentage >= 80 && (
              <span className={`font-medium ${color === 'red' ? 'text-red-600' : 'text-orange-600'}`}>
                {percentage >= 100 ? 'Limit reached' : 'Approaching limit'}
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="text-xs text-muted-foreground">Unlimited</div>
      )}
    </div>
  )
}

export function UsageMeters({ usage, plan }: UsageMetersProps) {
  if (!usage || !plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>No usage data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const documentsPercentage = calculateUsagePercentage(
    usage.documents_count,
    plan.max_documents
  )
  const apiCallsPercentage = calculateUsagePercentage(
    usage.api_calls_count,
    plan.max_api_calls_per_month
  )
  const storagePercentage = calculateUsagePercentage(
    usage.storage_bytes / (1024 * 1024 * 1024), // Convert to GB
    plan.max_storage_gb
  )
  const usersPercentage = calculateUsagePercentage(usage.active_users_count, plan.max_users)

  const hasWarning =
    documentsPercentage >= 80 ||
    apiCallsPercentage >= 80 ||
    storagePercentage >= 80 ||
    usersPercentage >= 80

  const periodStart = new Date(usage.period_start).toLocaleDateString()
  const periodEnd = new Date(usage.period_end).toLocaleDateString()

  return (
    <div className="space-y-4">
      {hasWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Usage Warning</AlertTitle>
          <AlertDescription>
            You're approaching or have exceeded your plan limits. Consider upgrading your plan to
            avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
          <CardDescription>
            Billing period: {periodStart} - {periodEnd}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <UsageMeter
            icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            label="Documents"
            current={usage.documents_count}
            limit={plan.max_documents}
          />

          <UsageMeter
            icon={<Database className="h-4 w-4 text-muted-foreground" />}
            label="Storage"
            current={usage.storage_bytes}
            limit={plan.max_storage_gb ? plan.max_storage_gb * 1024 * 1024 * 1024 : null}
            formatter={formatBytes}
          />

          <UsageMeter
            icon={<Zap className="h-4 w-4 text-muted-foreground" />}
            label="API Calls"
            current={usage.api_calls_count}
            limit={plan.max_api_calls_per_month}
          />

          <UsageMeter
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            label="Active Users"
            current={usage.active_users_count}
            limit={plan.max_users}
          />

          {/* Overage charges */}
          {usage.overage_charges_cents > 0 && (
            <div className="pt-4 border-t">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Overage Charges</AlertTitle>
                <AlertDescription>
                  Additional charges this period: $
                  {(usage.overage_charges_cents / 100).toFixed(2)}
                  <ul className="mt-2 text-xs space-y-1">
                    {usage.overage_documents > 0 && (
                      <li>Documents: {formatNumber(usage.overage_documents)}</li>
                    )}
                    {usage.overage_storage_gb > 0 && (
                      <li>Storage: {usage.overage_storage_gb} GB</li>
                    )}
                    {usage.overage_api_calls > 0 && (
                      <li>API Calls: {formatNumber(usage.overage_api_calls)}</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
