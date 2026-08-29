export const INFO_SITE_URL =
  import.meta.env.VITE_INFO_SITE_URL || 'https://info.appleonthedesk.co.za'

export const APP_URL =
  import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')

export const APP_LOGIN_URL = `${APP_URL.replace(/\/$/, '')}/Login`
