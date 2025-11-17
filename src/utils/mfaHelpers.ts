/**
 * Multi-Factor Authentication (MFA) utilities
 * Supports TOTP (Time-based One-Time Password)
 */

import { supabaseClient } from '../providers/supabaseClient'
import type { AuthMFAEnrollResponse, AuthMFAVerifyResponse, AuthMFAChallengeResponse, AuthMFAUnenrollResponse } from '@supabase/supabase-js'

export interface MFAFactor {
  id: string
  type: 'totp'
  status: 'verified' | 'unverified'
  created_at: string
  updated_at: string
  friendly_name?: string
}

export interface MFAEnrollResult {
  success: boolean
  qrCode?: string
  secret?: string
  factorId?: string
  error?: string
}

export interface MFAVerifyResult {
  success: boolean
  error?: string
}

/**
 * Enroll a new TOTP factor for MFA
 * Returns QR code and secret for authenticator app setup
 */
export async function enrollMFAFactor(
  friendlyName: string = 'Authenticator App'
): Promise<MFAEnrollResult> {
  try {
    const { data, error }: AuthMFAEnrollResponse = await supabaseClient.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'No data returned from enrollment',
      }
    }

    return {
      success: true,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      factorId: data.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during MFA enrollment',
    }
  }
}

/**
 * Verify TOTP code to complete MFA enrollment
 */
export async function verifyMFAEnrollment(
  factorId: string,
  code: string
): Promise<MFAVerifyResult> {
  try {
    const challenge: AuthMFAChallengeResponse = await supabaseClient.auth.mfa.challenge({
      factorId,
    })

    if (challenge.error) {
      return {
        success: false,
        error: challenge.error.message,
      }
    }

    if (!challenge.data) {
      return {
        success: false,
        error: 'No challenge data received',
      }
    }

    const verify: AuthMFAVerifyResponse = await supabaseClient.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code,
    })

    if (verify.error) {
      return {
        success: false,
        error: verify.error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during MFA verification',
    }
  }
}

/**
 * Get all MFA factors for the current user
 */
export async function getMFAFactors(): Promise<{
  factors: MFAFactor[]
  error?: string
}> {
  try {
    const { data, error } = await supabaseClient.auth.mfa.listFactors()

    if (error) {
      return {
        factors: [],
        error: error.message,
      }
    }

    return {
      factors: (data?.all || []) as MFAFactor[],
    }
  } catch (error) {
    return {
      factors: [],
      error: error instanceof Error ? error.message : 'Unknown error fetching MFA factors',
    }
  }
}

/**
 * Unenroll (remove) an MFA factor
 */
export async function unenrollMFAFactor(factorId: string): Promise<MFAVerifyResult> {
  try {
    const { error }: AuthMFAUnenrollResponse = await supabaseClient.auth.mfa.unenroll({
      factorId,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during MFA unenrollment',
    }
  }
}

/**
 * Create an MFA challenge for login verification
 */
export async function createMFAChallenge(factorId: string): Promise<{
  challengeId?: string
  error?: string
}> {
  try {
    const { data, error }: AuthMFAChallengeResponse = await supabaseClient.auth.mfa.challenge({
      factorId,
    })

    if (error) {
      return {
        error: error.message,
      }
    }

    if (!data) {
      return {
        error: 'No challenge data received',
      }
    }

    return {
      challengeId: data.id,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error creating MFA challenge',
    }
  }
}

/**
 * Verify MFA code during login
 */
export async function verifyMFACode(
  factorId: string,
  challengeId: string,
  code: string
): Promise<MFAVerifyResult> {
  try {
    const { error }: AuthMFAVerifyResponse = await supabaseClient.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error verifying MFA code',
    }
  }
}

/**
 * Get MFA enrollment status for current user
 */
export async function getMFAStatus(): Promise<{
  isEnrolled: boolean
  hasVerifiedFactor: boolean
  factorCount: number
  error?: string
}> {
  const { factors, error } = await getMFAFactors()

  if (error) {
    return {
      isEnrolled: false,
      hasVerifiedFactor: false,
      factorCount: 0,
      error,
    }
  }

  const verifiedFactors = factors.filter(f => f.status === 'verified')

  return {
    isEnrolled: factors.length > 0,
    hasVerifiedFactor: verifiedFactors.length > 0,
    factorCount: factors.length,
  }
}
