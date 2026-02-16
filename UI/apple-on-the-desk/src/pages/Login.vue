<template>
  <div class="container">
    <div class="title">
      Sign in or <span class="titleAccent">create account</span>
    </div>

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

      <v-btn class="googleButton" :loading="googleLoading" :disabled="loading || googleLoading"
        @click="handleGoogleSignIn">
        <v-icon start>mdi-google</v-icon>
        Continue with Google
      </v-btn>
    </div>

    <v-btn variant="text" class="backLink" @click="navigateTo('/')">
      ← Back to home
    </v-btn>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { toast } from 'vue-sonner'

const router = useRouter()
const { signInWithEmail, registerWithEmail, signInWithGoogle } = useAuth()

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
    toast.success('Signed in!')
    router.push('/')
  } catch (err) {
    if (err?.code === 'auth/user-not-found') {
      try {
        await registerWithEmail(email.value, password.value)
        toast.success('Account created!')
        router.push('/')
      } catch (regErr) {
        errorMessage.value = regErr?.message?.replace('Firebase: ', '') || 'Could not create account.'
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
    toast.success('Signed in with Google!')
    router.push('/')
  } catch (err) {
    errorMessage.value = err?.message?.replace('Firebase: ', '') || 'Google sign in failed.'
  } finally {
    googleLoading.value = false
  }
}

function navigateTo(path) {
  router.push(path)
}
</script>

<style scoped>
@import '../styles/style.css';

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
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.18);
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
  -webkit-box-shadow: 0 0 0 30px rgba(0, 23, 31, 0.95) inset !important;
  box-shadow: 0 0 0 30px rgba(0, 23, 31, 0.95) inset !important;
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
  color: rgba(255, 255, 255, 0.5);
  font-family: var(--font);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
}

.submitButton,
.googleButton {
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
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
}

.googleButton {
  background: rgba(255, 255, 255, 0.08) !important;
  color: var(--white) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
}

.backLink {
  margin-top: 1rem;
  color: rgba(255, 255, 255, 0.7) !important;
  font-family: var(--font) !important;
  text-transform: none !important;
}

.backLink:hover {
  color: var(--white) !important;
}
</style>
