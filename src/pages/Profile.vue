<template>
  <div class="profileRoot" :class="{ 'profileRoot--embedded': embedded }">
    <div v-if="!embedded" class="title">
      <span class="titleAccent">Profile</span>
    </div>

    <div v-if="authReady" class="profileCard">
      <template v-if="user">
        <div class="userInfo">
          <v-avatar size="64" color="rgba(0, 168, 232, 0.4)" class="avatar">
            <span class="avatarText">{{ avatarLetter }}</span>
          </v-avatar>
          <div class="userDetails">
            <p class="displayName">{{ user.displayName || 'Signed-in user' }}</p>
            <p class="email">{{ user.email }}</p>
          </div>
        </div>
        <v-btn class="signOutButton" @click="handleSignOut" :loading="signingOut">
          Sign out
        </v-btn>
        <v-btn class="signOutButton" variant="outlined" :loading="deletingAccount" :disabled="signingOut"
          @click="confirmDeleteOpen = true">
          <v-icon>mdi-delete</v-icon> Delete account
        </v-btn>
      </template>
      <template v-else>
        <p class="signedOutMessage">You are not signed in.</p>
        <v-btn class="submitButton" @click="navigateTo('/Login')">
          Sign in or create account
        </v-btn>
      </template>
    </div>

    <v-btn v-if="!embedded" variant="text" class="backLink" @click="navigateTo('/Teacher')">
      ← Back
    </v-btn>

    <v-dialog v-model="confirmDeleteOpen" max-width="400" persistent>
      <v-card class="confirmCard">
        <v-card-title class="confirmTitle">Delete account?</v-card-title>
        <v-card-text class="confirmText">
          This will permanently delete your account and all your classes, points categories, and shop items. You cannot
          undo
          this.
        </v-card-text>
        <v-card-actions class="confirmActions">
          <v-spacer />
          <v-btn variant="text" @click="confirmDeleteOpen = false">Cancel</v-btn>
          <v-btn color="error" :loading="deletingAccount" @click="handleDeleteAccount">
            Delete account
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { toast } from 'vue-sonner'
import server from '@/services/server'

defineProps({
  embedded: { type: Boolean, default: false }
})

const router = useRouter()
const { user, authReady, signOut } = useAuth()
const signingOut = ref(false)
const deletingAccount = ref(false)
const confirmDeleteOpen = ref(false)

const avatarLetter = computed(() => {
  const u = user.value
  if (u?.displayName) return u.displayName.charAt(0).toUpperCase()
  if (u?.email) return u.email.charAt(0).toUpperCase()
  return '?'
})

async function handleSignOut() {
  signingOut.value = true
  try {
    await signOut()
    toast.success('Signed out')
    router.push('/')
  } catch (err) {
    toast.error(err?.message || 'Sign out failed')
  } finally {
    signingOut.value = false
  }
}

async function handleDeleteAccount() {
  deletingAccount.value = true
  try {
    await server.deleteAccount()
    confirmDeleteOpen.value = false
    await signOut()
    toast.success('Account deleted')
    router.push('/')
  } catch (err) {
    toast.error(err?.response?.data?.message || err?.message || 'Failed to delete account')
  } finally {
    deletingAccount.value = false
  }
}

function navigateTo(path) {
  router.push(path)
}
</script>

<style scoped>
@import '../styles/style.css';

.profileRoot {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
}

.profileRoot--embedded {
  min-height: 0;
  justify-content: flex-start;
  padding: 0;
  width: 100%;
}

.profileRoot--embedded .profileCard {
  max-width: 100%;
  padding: 0.75rem 0;
  gap: 1rem;
}

.profileRoot--embedded .userInfo {
  padding: 0.75rem 1rem;
  border-radius: 12px;
}

.profileRoot--embedded .avatar {
  width: 48px !important;
  height: 48px !important;
  min-width: 48px;
  min-height: 48px;
}

.profileRoot--embedded .avatarText {
  font-size: 1.25rem;
}

.profileRoot--embedded .displayName {
  font-size: 1.1rem;
}

.profileRoot--embedded .email {
  font-size: 0.875rem;
}

.profileRoot--embedded .signOutButton,
.profileRoot--embedded .submitButton {
  height: 44px !important;
  border-radius: 12px !important;
}

.profileCard {
  width: 100%;
  max-width: min(420px, 90vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
}

.userInfo {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.avatar {
  flex-shrink: 0;
}

.avatarText {
  font-family: var(--font);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--white);
}

.userDetails {
  min-width: 0;
}

.displayName {
  font-family: var(--font);
  font-weight: 600;
  font-size: 1.25rem;
  color: var(--white);
  margin: 0 0 0.25rem 0;
}

.email {
  font-family: var(--font);
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.signedOutMessage {
  font-family: var(--font);
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.signOutButton,
.submitButton {
  width: 100%;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0.02em;
  border-radius: 16px !important;
  height: 52px !important;
}

.signOutButton {
  background: rgba(197, 40, 61, 0.5) !important;
  color: var(--white) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.deleteAccountButton {
  color: rgba(255, 255, 255, 0.7) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  font-family: var(--font) !important;
  text-transform: none !important;
}

.deleteAccountButton:hover {
  color: var(--intenseCherry) !important;
  border-color: rgba(197, 40, 61, 0.6) !important;
}

.confirmCard {
  background: var(--inkBlack) !important;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.confirmTitle {
  color: var(--white);
  font-family: var(--font);
}

.confirmText {
  color: rgba(255, 255, 255, 0.85);
  font-family: var(--font);
}

.confirmActions {
  padding: 0 16px 16px;
}

.submitButton {
  background: linear-gradient(135deg,
      rgba(0, 168, 232, 0.55) 0%,
      rgba(0, 168, 232, 0.35) 50%,
      rgba(0, 168, 232, 0.45) 100%) !important;
  color: var(--white) !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
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
