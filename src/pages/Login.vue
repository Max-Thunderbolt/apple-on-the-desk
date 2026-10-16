<template>
  <div class="container">
    <div class="title">
      Sign in or <span class="titleAccent">create account</span>
    </div>
    <p class="audienceNote">For teachers and school staff. Learners don't sign in.</p>

    <div class="formCard">
      <v-form ref="formRef" @submit.prevent="handleSubmit" class="loginForm">
        <v-text-field v-model="email" label="Email" type="email" variant="outlined" :rules="emailRules"
          autocomplete="email" class="field" density="comfortable" />
        <v-text-field v-model="password" label="Password" :type="showPassword ? 'text' : 'password'" variant="outlined"
          :rules="passwordRules" class="field" density="comfortable"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword" />
        <v-alert v-if="errorMessage" type="error" density="compact" class="errorAlert" closable>
          {{ errorMessage }}
        </v-alert>
        <v-btn type="submit" class="submitButton" :loading="loading" :disabled="loading">
          Sign in or create account
        </v-btn>
      </v-form>

      <div class="divider">
        <span>or</span>
      </div>

      <!-- Google branding guidelines: standard-colour G, white fill, #747775 stroke, #1F1F1F text -->
      <button type="button" class="gsiButton" :disabled="loading || googleLoading" @click="handleGoogleSignIn">
        <span class="gsiIcon" aria-hidden="true">
          <v-progress-circular v-if="googleLoading" indeterminate size="18" width="2" color="#1F1F1F" />
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
        </span>
        <span class="gsiLabel">Continue with Google</span>
      </button>

      <p class="legalNote">
        By continuing you agree to our
        <a :href="TERMS_URL" target="_blank" rel="noopener">Terms</a>
        and
        <a :href="PRIVACY_URL" target="_blank" rel="noopener">Privacy Policy</a>.
      </p>
    </div>

    <a :href="INFO_SITE_URL" class="backLink">New here? Learn about Apple On The Desk →</a>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { toast } from 'vue-sonner'
import server from '@/services/server'
import { applyUserProfilePayload } from '@/composables/useUserProfile'
import { resolvePostAuthDestinationAsync } from '@/composables/usePostAuthDestination'
import { INFO_SITE_URL, TERMS_URL, PRIVACY_URL } from '@/config/siteUrls'
import { safeRedirect } from '@/utils/safeRedirect'

// Firebase-managed OAuth web client. School Google admins can mark it Trusted.
const GOOGLE_OAUTH_CLIENT_ID = '1777243046-e49j7djffttpnrsue7915r87m0fp1vhd.apps.googleusercontent.com'

const router = useRouter()
const route = useRoute()
const { signInWithEmail, registerWithEmail, signInWithGoogle } = useAuth()

async function postLoginRedirect() {
  try {
    const profile = await server.upsertUser()
    applyUserProfilePayload(profile)
    const redirectTarget = safeRedirect(route.query.redirect)
    if (redirectTarget) {
      router.push(redirectTarget)
      return
    }
    router.push(await resolvePostAuthDestinationAsync({}))
  } catch {
    router.push('/GetStarted')
  }
}

const formRef = ref(null)
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const googleLoading = ref(false)
const errorMessage = ref('')

const emailRules = [
  (v) => !!v || 'Email is required',
  (v) => /.+@.+\..+/.test(v) || 'Enter a valid email'
]
const passwordRules = [
  (v) => !!v || 'Password is required',
  (v) => (v && v.length >= 6) || 'Password must be at least 6 characters'
]

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  errorMessage.value = ''
  loading.value = true
  try {
    await signInWithEmail(email.value, password.value)
    toast.success('Signed in')
    await postLoginRedirect()
  } catch (err) {
    const tryRegister =
      err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential'
    if (tryRegister) {
      try {
        await registerWithEmail(email.value, password.value)
        toast.success('Account created')
        await postLoginRedirect()
      } catch (regErr) {
        if (regErr?.code === 'auth/email-already-in-use') {
          errorMessage.value = 'An account with this email already exists. Sign in with your password.'
        } else {
          errorMessage.value = regErr?.message?.replace('Firebase: ', '') || 'Could not create account.'
        }
      }
    } else {
      errorMessage.value = err?.message?.replace('Firebase: ', '') || 'Sign in failed.'
    }
  } finally {
    loading.value = false
  }
}

async function handleGoogleSignIn() {
  errorMessage.value = ''
  googleLoading.value = true
  try {
    await signInWithGoogle()
    toast.success('Signed in with Google')
    await postLoginRedirect()
  } catch (err) {
    const message = googleSignInErrorMessage(err)
    if (message) errorMessage.value = message
  } finally {
    googleLoading.value = false
  }
}

/** Friendly copy for Google popup errors, including Workspace admin blocks. null = say nothing. */
function googleSignInErrorMessage(err) {
  const code = err?.code || ''
  const text = `${code} ${err?.message || ''} ${err?.customData?._tokenResponse?.errorMessage || ''}`
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return null
  if (code === 'auth/popup-blocked') {
    return 'Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again, or sign in with email.'
  }
  if (/admin_policy_enforced|access_not_configured/i.test(text)) {
    return `Your school's Google admin hasn't approved Apple On The Desk yet. Use email sign-in, or ask IT to allow client ID ${GOOGLE_OAUTH_CLIENT_ID}.`
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'This email already has an account with a different sign-in method. Sign in with email and password.'
  }
  if (code === 'auth/network-request-failed') return 'Network error. Check your connection and try again.'
  return err?.message?.replace('Firebase: ', '') || 'Google sign in failed.'
}
</script>

<style scoped>
.formCard {
  width: 100%;
  max-width: min(420px, 90vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
}

.loginForm {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field :deep(.v-field) {
  border-radius: 12px;
  background: rgba(var(--ink-rgb), 0.06) !important;
  border: 1px solid rgba(var(--ink-rgb), 0.18);
}

.field :deep(.v-field__input) {
  background: transparent !important;
}

.field :deep(.v-field__outline) {
  --v-field-border-opacity: 0.3;
}

.field :deep(.v-input__control input),
.field :deep(.v-field label) {
  color: var(--white);
}

/* Remove browser autofill yellow background */
.field :deep(input:-webkit-autofill),
.field :deep(input:-webkit-autofill:hover),
.field :deep(input:-webkit-autofill:focus),
.field :deep(input:-webkit-autofill:active) {
  -webkit-box-shadow: 0 0 0 30px rgba(var(--color-bg-rgb), 0.95) inset !important;
  box-shadow: 0 0 0 30px rgba(var(--color-bg-rgb), 0.95) inset !important;
  -webkit-text-fill-color: var(--white);
}

.errorAlert {
  border-radius: 12px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  color: rgba(var(--ink-rgb), 0.5);
  font-family: var(--font);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(var(--ink-rgb), 0.2);
}

.submitButton {
  width: 100%;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0.02em;
  border-radius: 16px !important;
  height: 52px !important;
}

.submitButton {
  background: linear-gradient(135deg,
      rgba(0, 168, 232, 0.55) 0%,
      rgba(0, 168, 232, 0.35) 50%,
      rgba(0, 168, 232, 0.45) 100%) !important;
  color: var(--white) !important;
  border: 1px solid rgba(var(--ink-rgb), 0.18) !important;
}

/* Google branding: light theme button (https://developers.google.com/identity/branding-guidelines) */
.gsiButton {
  width: 100%;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 16px;
  background: #ffffff;
  border: 1px solid #747775;
  border-radius: 16px;
  color: #1f1f1f;
  font-family: 'Google Sans', 'Roboto', arial, sans-serif;
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.25px;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.gsiButton:hover:not(:disabled) {
  background: #f8f9fa;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
}

.gsiButton:focus-visible {
  outline: 2px solid #4285f4;
  outline-offset: 2px;
}

.gsiButton:disabled {
  opacity: 0.6;
  cursor: default;
}

.gsiIcon {
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
}

.audienceNote,
.legalNote {
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.65);
  text-align: center;
  margin: 0;
}

.legalNote a {
  color: rgba(var(--ink-rgb), 0.9);
}

.backLink {
  margin-top: 1rem;
  color: rgba(var(--ink-rgb), 0.7) !important;
  font-family: var(--font) !important;
  text-transform: none !important;
}

.backLink:hover {
  color: var(--white) !important;
}
</style>
