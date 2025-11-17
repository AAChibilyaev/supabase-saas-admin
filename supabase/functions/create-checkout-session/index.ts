/**
 * Supabase Edge Function: Create Checkout Session
 * Issue #28: Stripe Billing & Subscription Management
 *
 * Creates a Stripe Checkout session for subscription purchase
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckoutRequest {
  priceId: string
  successUrl: string
  cancelUrl: string
  customerId?: string
  customerEmail?: string
  trialPeriodDays?: number
  metadata?: Record<string, string>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: CheckoutRequest = await req.json()
    const { priceId, successUrl, cancelUrl, trialPeriodDays, metadata } = body
    let { customerId, customerEmail } = body

    if (!priceId || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if customer already exists
    const { data: existingCustomer } = await supabaseClient
      .from('stripe_customers')
      .select('stripe_customer_id, email')
      .eq('user_id', user.id)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.stripe_customer_id
      customerEmail = existingCustomer.email
    } else {
      // Create new Stripe customer if needed
      customerEmail = customerEmail || user.email || ''
      const customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          supabase_user_id: user.id,
          ...metadata,
        },
      })
      customerId = customer.id

      // Save customer to database
      await supabaseClient.from('stripe_customers').insert({
        user_id: user.id,
        stripe_customer_id: customer.id,
        email: customerEmail,
        metadata: metadata || {},
      })
    }

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      metadata: {
        user_id: user.id,
        ...metadata,
      },
    }

    // Add trial period if specified
    if (trialPeriodDays && trialPeriodDays > 0) {
      sessionParams.subscription_data = {
        trial_period_days: trialPeriodDays,
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
