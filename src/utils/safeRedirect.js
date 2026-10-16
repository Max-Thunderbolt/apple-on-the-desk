/**
 * Accept a post-login redirect only if it is a same-origin app path.
 * Rejects protocol-relative (`//evil.com`), backslash tricks (`/\evil.com`), absolute URLs and /Login itself.
 * @param {unknown} raw
 * @returns {string|null}
 */
export function safeRedirect(raw) {
  if (typeof raw !== 'string') return null
  const value = raw.trim()
  if (!/^\/(?![/\\])/.test(value)) return null
  if (/[\u0000-\u001f]/.test(value)) return null
  const path = value.split(/[?#]/)[0]
  if (path === '/Login' || path === '/') return null
  return value
}
