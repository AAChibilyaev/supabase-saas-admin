/**
 * Generate a secure random token for invitations
 * @param length - Length of the token (default: 32)
 * @returns A secure random token string
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a URL-safe token
 * @param length - Length of the token (default: 32)
 * @returns A URL-safe random token string
 */
export function generateUrlSafeToken(length: number = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, length)
}

/**
 * Validate a token format
 * @param token - Token to validate
 * @returns True if token is valid format
 */
export function isValidToken(token: string): boolean {
  return /^[a-f0-9]{32,}$/i.test(token) || /^[A-Za-z0-9_-]{32,}$/.test(token)
}
