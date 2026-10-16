import { ref, computed } from 'vue'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth'
import { auth } from '@/firebase'

const user = ref(null)
const authReady = ref(false)
let authSubscribed = false

let resolveAuthReady
const authReadyPromise = new Promise((resolve) => {
  resolveAuthReady = resolve
})

/** Resolves once Firebase has reported the initial auth state (signed in or not). */
export function waitForAuthReady() {
  return authReadyPromise
}

export function initAuth() {
  if (authSubscribed) return
  authSubscribed = true
  onAuthStateChanged(auth, (u) => {
    user.value = u
    authReady.value = true
    resolveAuthReady()
  })
}

export function useAuth() {
  const isSignedIn = computed(() => !!user.value)

  async function signInWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function registerWithEmail(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    // Default scopes only (openid email profile). Let teachers with personal and school
    // Google accounts choose the right one.
    provider.setCustomParameters({ prompt: 'select_account' })
    return signInWithPopup(auth, provider)
  }

  async function signOut() {
    return firebaseSignOut(auth)
  }

  return {
    user,
    authReady,
    isSignedIn,
    signInWithEmail,
    registerWithEmail,
    signInWithGoogle,
    signOut
  }
}
