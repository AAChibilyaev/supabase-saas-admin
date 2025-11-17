/**
 * Password validation utilities
 * Implements password strength requirements and HaveIBeenPwned integration
 */

export interface PasswordStrengthResult {
  isValid: boolean
  score: number // 0-4 (0 = very weak, 4 = very strong)
  feedback: string[]
  requirements: {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
    hasSpecialChar: boolean
  }
}

export interface PasswordValidationConfig {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumber: boolean
  requireSpecialChar: boolean
  checkBreached: boolean
}

export const DEFAULT_PASSWORD_CONFIG: PasswordValidationConfig = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  checkBreached: true,
}

/**
 * Validates password against strength requirements
 */
export function validatePasswordStrength(
  password: string,
  config: PasswordValidationConfig = DEFAULT_PASSWORD_CONFIG
): PasswordStrengthResult {
  const feedback: string[] = []
  let score = 0

  // Check requirements
  const requirements = {
    minLength: password.length >= config.minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }

  // Validate requirements
  if (!requirements.minLength) {
    feedback.push(`Password must be at least ${config.minLength} characters long`)
  } else {
    score++
  }

  if (config.requireUppercase && !requirements.hasUppercase) {
    feedback.push('Password must contain at least one uppercase letter')
  } else if (requirements.hasUppercase) {
    score++
  }

  if (config.requireLowercase && !requirements.hasLowercase) {
    feedback.push('Password must contain at least one lowercase letter')
  } else if (requirements.hasLowercase) {
    score++
  }

  if (config.requireNumber && !requirements.hasNumber) {
    feedback.push('Password must contain at least one number')
  } else if (requirements.hasNumber) {
    score++
  }

  if (config.requireSpecialChar && !requirements.hasSpecialChar) {
    feedback.push('Password must contain at least one special character (!@#$%^&*()...)')
  } else if (requirements.hasSpecialChar) {
    score++
  }

  // Additional strength checks
  if (password.length >= 12) {
    score++
    feedback.push('Good: Password length is strong')
  }

  // Check for common patterns
  if (/^(.)\1+$/.test(password)) {
    feedback.push('Weak: Password contains repeating characters')
    score = Math.max(0, score - 2)
  }

  if (/^(012|123|234|345|456|567|678|789|890)/.test(password)) {
    feedback.push('Weak: Password contains sequential numbers')
    score = Math.max(0, score - 1)
  }

  if (/^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    feedback.push('Weak: Password contains sequential letters')
    score = Math.max(0, score - 1)
  }

  const isValid = Object.values(requirements).every((req, index) => {
    const configKeys = Object.keys(config)
    const reqKey = Object.keys(requirements)[index]
    if (reqKey === 'minLength') return req
    const configValue = config[configKeys.find(k => k.includes(reqKey.replace('has', '').toLowerCase())) as keyof PasswordValidationConfig]
    return !configValue || req
  })

  return {
    isValid,
    score: Math.min(4, score),
    feedback: feedback.length === 0 ? ['Password meets all requirements'] : feedback,
    requirements,
  }
}

/**
 * Check if password has been breached using HaveIBeenPwned API
 * Uses k-anonymity model - only sends first 5 chars of SHA-1 hash
 */
export async function checkPasswordBreached(password: string): Promise<{
  isBreached: boolean
  breachCount: number
}> {
  try {
    // Create SHA-1 hash of password
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()

    // Use k-anonymity: send only first 5 chars
    const prefix = hashHex.substring(0, 5)
    const suffix = hashHex.substring(5)

    // Query HaveIBeenPwned API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)

    if (!response.ok) {
      console.warn('Failed to check password breach status')
      return { isBreached: false, breachCount: 0 }
    }

    const text = await response.text()
    const hashes = text.split('\n')

    // Check if our hash suffix is in the response
    for (const line of hashes) {
      const [hashSuffix, count] = line.split(':')
      if (hashSuffix === suffix) {
        return {
          isBreached: true,
          breachCount: parseInt(count, 10),
        }
      }
    }

    return { isBreached: false, breachCount: 0 }
  } catch (error) {
    console.error('Error checking password breach:', error)
    // Fail open - don't block user if service is down
    return { isBreached: false, breachCount: 0 }
  }
}

/**
 * Comprehensive password validation including breach check
 */
export async function validatePassword(
  password: string,
  config: PasswordValidationConfig = DEFAULT_PASSWORD_CONFIG
): Promise<PasswordStrengthResult & { isBreached?: boolean; breachCount?: number }> {
  const strengthResult = validatePasswordStrength(password, config)

  if (!strengthResult.isValid) {
    return strengthResult
  }

  if (config.checkBreached) {
    const breachResult = await checkPasswordBreached(password)

    if (breachResult.isBreached) {
      return {
        ...strengthResult,
        isValid: false,
        isBreached: true,
        breachCount: breachResult.breachCount,
        feedback: [
          ...strengthResult.feedback,
          `This password has been found in ${breachResult.breachCount.toLocaleString()} data breaches. Please choose a different password.`,
        ],
      }
    }

    return {
      ...strengthResult,
      isBreached: false,
      breachCount: 0,
    }
  }

  return strengthResult
}

/**
 * Generate a strong password suggestion
 */
export function generateStrongPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // Removed I, O for clarity
  const lowercase = 'abcdefghijkmnopqrstuvwxyz' // Removed l for clarity
  const numbers = '23456789' // Removed 0, 1 for clarity
  const special = '!@#$%^&*()_+-=[]{}|'

  const allChars = uppercase + lowercase + numbers + special
  const required = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    special[Math.floor(Math.random() * special.length)],
  ]

  // Fill remaining length with random chars
  const remaining = Array.from(
    { length: length - required.length },
    () => allChars[Math.floor(Math.random() * allChars.length)]
  )

  // Combine and shuffle
  const password = [...required, ...remaining]
    .sort(() => Math.random() - 0.5)
    .join('')

  return password
}
