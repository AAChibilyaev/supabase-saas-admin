/**
 * Checkout Success Page
 * Issue #28: Stripe Billing & Subscription Management
 *
 * Displayed after successful Stripe checkout
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function CheckoutSuccess() {
  const navigate = useNavigate()

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timeout = setTimeout(() => {
      navigate('/billing')
    }, 5000)

    return () => clearTimeout(timeout)
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Your subscription has been activated successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Thank you for subscribing! Your account has been upgraded and you now have access to
            all the features of your plan.
          </p>
          <p className="text-xs text-muted-foreground">
            You will receive a confirmation email shortly with your invoice and subscription
            details.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => navigate('/billing')}>
            Go to Billing Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
