import { beforeEach, describe, expect, it, vi } from 'vitest'

// Firebase auth: capture the onAuthStateChanged callback so tests decide when auth resolves.
let authCallback = null
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, cb) => {
    authCallback = cb
  },
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: class {
    setCustomParameters() {}
  },
  signOut: vi.fn(),
}))
vi.mock('@/firebase', () => ({ auth: {}, app: {} }))
vi.mock('@/services/server', () => ({
  default: {
    getUser: vi.fn(async () => ({
      success: true,
      user: { userId: 'u1' },
      memberships: [{ role: 'teacher', schoolId: 'S' }],
      isPlatformAdmin: false,
      schoolAdminSchoolIds: [],
    })),
  },
  apiUrl: (p) => p,
}))

async function freshRouter() {
  vi.resetModules()
  authCallback = null
  const { initAuth } = await import('@/composables/useAuth')
  initAuth()
  const { default: router } = await import('@/router/index.js')
  return router
}

describe('router guard (first visit)', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('waits for Firebase before deciding: signed-out /Classes → /Login?redirect=/Classes', async () => {
    const router = await freshRouter()
    const nav = router.push('/Classes')
    await new Promise((r) => setTimeout(r, 500)) // auth resolves late
    expect(router.currentRoute.value.path).not.toBe('/Classes')
    authCallback(null)
    await nav
    expect(router.currentRoute.value.path).toBe('/Login')
    expect(router.currentRoute.value.query.redirect).toBe('/Classes')
  })

  it('signed-out / → /Login without redirect, no bounce to the marketing site', async () => {
    const replace = vi.spyOn(window.location, 'replace').mockImplementation(() => {})
    const router = await freshRouter()
    authCallback(null)
    await router.push('/')
    expect(router.currentRoute.value.fullPath).toBe('/Login')
    expect(replace).not.toHaveBeenCalled()
    replace.mockRestore()
  })

  it('deep links keep their path: /Class/abc → /Login?redirect=%2FClass%2Fabc', async () => {
    const router = await freshRouter()
    authCallback(null)
    await router.push('/Class/abc')
    expect(router.currentRoute.value.fullPath).toBe('/Login?redirect=/Class/abc')
  })

  it('unknown paths show the 404 page', async () => {
    const router = await freshRouter()
    authCallback(null)
    await router.push('/Classes/does-not-exist')
    expect(router.currentRoute.value.name).toBe('/[...path]')
  })

  it('signed-in teacher on /Login goes to /Classes; a safe redirect is honoured; //evil.com is not', async () => {
    const router = await freshRouter()
    authCallback({ uid: 'u1' })
    await router.push('/Login')
    expect(router.currentRoute.value.path).toBe('/Classes')

    await router.push('/Login?redirect=%2FClass%2Fabc')
    expect(router.currentRoute.value.path).toBe('/Class/abc')

    await router.push('/Login?redirect=%2F%2Fevil.com')
    expect(router.currentRoute.value.path).toBe('/Classes')
  })
})
