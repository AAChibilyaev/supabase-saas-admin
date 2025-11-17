/**
 * Stripe Configuration and Utilities
 * Issue #28: Stripe Billing & Subscription Management
 */

import { loadStripe, Stripe } from '@stripe/stripe-js'

// Stripe publishable key from environment
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

// Lazy load Stripe instance
let stripePromise: Promise<Stripe | null> | null = null

/**
 * Get or create Stripe instance
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    if (!STRIPE_PUBLISHABLE_KEY) {
      console.error('Stripe publishable key is not configured')
      return Promise.resolve(null)
    }
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

/**
 * Format currency amount from cents to dollars
 */
export const formatCurrency = (
  amountInCents: number,
  currency: string = 'usd'
): string => {
  const amount = amountInCents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

/**
 * Format billing interval
 */
export const formatInterval = (
  interval: string,
  intervalCount: number = 1
): string => {
  if (intervalCount === 1) {
    return `per ${interval}`
  }
  return `every ${intervalCount} ${interval}s`
}

/**
 * Get subscription status badge color
 */
export const getSubscriptionStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    active: 'green',
    trialing: 'blue',
    past_due: 'yellow',
    canceled: 'red',
    unpaid: 'red',
    incomplete: 'gray',
    incomplete_expired: 'gray',
    paused: 'gray',
  }
  return statusColors[status] || 'gray'
}

/**
 * Get subscription status label
 */
export const getSubscriptionStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past Due',
    canceled: 'Canceled',
    unpaid: 'Unpaid',
    incomplete: 'Incomplete',
    incomplete_expired: 'Expired',
    paused: 'Paused',
  }
  return statusLabels[status] || status
}

/**
 * Get invoice status badge color
 */
export const getInvoiceStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    paid: 'green',
    open: 'blue',
    draft: 'gray',
    uncollectible: 'red',
    void: 'gray',
  }
  return statusColors[status] || 'gray'
}

/**
 * Calculate usage percentage
 */
export const calculateUsagePercentage = (
  current: number,
  limit: number | null
): number => {
  if (limit === null || limit === 0) return 0
  return Math.min(Math.round((current / limit) * 100), 100)
}

/**
 * Get usage color based on percentage
 */
export const getUsageColor = (percentage: number): string => {
  if (percentage >= 100) return 'red'
  if (percentage >= 90) return 'orange'
  if (percentage >= 80) return 'yellow'
  return 'green'
}

/**
 * Format bytes to human readable size
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Format large numbers with commas
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Check if trial is ending soon (within 3 days)
 */
export const isTrialEndingSoon = (trialEnd: Date | null): boolean => {
  if (!trialEnd) return false
  const threeDaysFromNow = new Date()
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
  return trialEnd <= threeDaysFromNow
}

/**
 * Get days until trial ends
 */
export const getDaysUntilTrialEnd = (trialEnd: Date | null): number => {
  if (!trialEnd) return 0
  const now = new Date()
  const diff = trialEnd.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Stripe API error handler
 */
export class StripeError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'StripeError'
  }
}

/**
 * Handle Stripe API errors
 */
export const handleStripeError = (error: unknown): StripeError => {
  if (error instanceof StripeError) {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    const stripeError = error as {
      message?: string
      code?: string
      statusCode?: number
    }
    return new StripeError(
      stripeError.message || 'An unknown error occurred',
      stripeError.code,
      stripeError.statusCode
    )
  }

  return new StripeError('An unknown error occurred')
}

/**
 * Validate credit card expiration
 */
export const isCardExpired = (expMonth: number, expYear: number): boolean => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  if (expYear < currentYear) return true
  if (expYear === currentYear && expMonth < currentMonth) return true
  return false
}

/**
 * Get card brand icon
 */
export const getCardBrandIcon = (brand: string): string => {
  const brandIcons: Record<string, string> = {
    visa: '💳',
    mastercard: '💳',
    amex: '💳',
    discover: '💳',
    diners: '💳',
    jcb: '💳',
    unionpay: '💳',
  }
  return brandIcons[brand.toLowerCase()] || '💳'
}

export default {
  getStripe,
  formatCurrency,
  formatInterval,
  getSubscriptionStatusColor,
  getSubscriptionStatusLabel,
  getInvoiceStatusColor,
  calculateUsagePercentage,
  getUsageColor,
  formatBytes,
  formatNumber,
  isTrialEndingSoon,
  getDaysUntilTrialEnd,
  handleStripeError,
  isCardExpired,
  getCardBrandIcon,
}
