// Marketing site (the info. subdomain has no valid certificate; use the apex domain)
export const INFO_SITE_URL = (import.meta.env.VITE_INFO_SITE_URL || 'https://appleonthedesk.co.za').replace(/\/$/, '')

export const TERMS_URL = `${INFO_SITE_URL}/terms`
export const PRIVACY_URL = `${INFO_SITE_URL}/privacy`

export const APP_URL =
  import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')

export const APP_LOGIN_URL = `${APP_URL.replace(/\/$/, '')}/Login`
