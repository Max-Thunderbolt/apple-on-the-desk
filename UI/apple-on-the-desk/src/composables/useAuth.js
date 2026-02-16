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

export function initAuth() {
  if (authSubscribed) return
  authSubscribed = true
  onAuthStateChanged(auth, (u) => {
    user.value = u
    authReady.value = true
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
