<template>
  <div class="container getStartedPage">
    <div class="getStartedCard">
      <h1 class="getStartedTitle">Almost <span class="titleAccent">there</span></h1>
      <p class="getStartedBody">
        Apple on the Desk works through your school. You need an invite from your school admin to
        create classes and award points.
      </p>

      <div v-if="showInviteForm" class="inviteForm">
        <label class="formLabel" for="invite-link">Paste your invite link</label>
        <input
          id="invite-link"
          v-model="inviteLinkInput"
          type="url"
          class="formInput"
          placeholder="https://…/Join/your-code"
          @keyup.enter="continueWithInvite"
        />
        <p v-if="inviteError" class="formError">{{ inviteError }}</p>
        <v-btn class="primaryBtn" :disabled="!inviteLinkInput.trim()" @click="continueWithInvite">
          Continue
        </v-btn>
        <v-btn variant="text" class="textBtn" @click="showInviteForm = false">Cancel</v-btn>
      </div>

      <div v-else class="actions">
        <v-btn class="primaryBtn" prepend-icon="mdi-link-variant" @click="showInviteForm = true">
          I have an invite link
        </v-btn>
        <a :href="schoolsInfoUrl" class="secondaryLink">Learn about school plans</a>
        <v-btn variant="text" class="textBtn" @click="router.push('/Profile')">Account settings</v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { INFO_SITE_URL } from '@/config/siteUrls'

const router = useRouter()
const showInviteForm = ref(false)
const inviteLinkInput = ref('')
const inviteError = ref('')

const schoolsInfoUrl = computed(() => `${INFO_SITE_URL.replace(/\/$/, '')}#schools`)

function parseJoinPath(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return null

  try {
    const url = trimmed.startsWith('http') ? new URL(trimmed) : new URL(trimmed, window.location.origin)
    const match = url.pathname.match(/\/Join\/([^/]+)/i)
    if (match?.[1]) return `/Join/${decodeURIComponent(match[1])}`
  } catch {
    /* fall through */
  }

  const pathMatch = trimmed.match(/\/?Join\/([^/?#]+)/i)
  if (pathMatch?.[1]) return `/Join/${decodeURIComponent(pathMatch[1])}`

  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return `/Join/${trimmed}`

  return null
}

function continueWithInvite() {
  inviteError.value = ''
  const path = parseJoinPath(inviteLinkInput.value)
  if (!path) {
    inviteError.value = 'Enter a valid invite link (should contain /Join/…)'
    return
  }
  router.push(path)
}
</script>

<style scoped>
.getStartedPage {
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.getStartedCard {
  width: 100%;
  max-width: 520px;
  padding: 1.5rem;
  border-radius: 20px;
  border: 1px solid rgba(var(--ink-rgb), 0.16);
  background: rgba(var(--color-bg-rgb), 0.5);
}

.getStartedTitle {
  margin: 0 0 0.75rem;
  font-family: var(--font);
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  color: var(--white);
}

.getStartedBody {
  margin: 0 0 1.25rem;
  font-family: var(--font);
  color: rgba(var(--ink-rgb), 0.75);
  line-height: 1.5;
}

.actions,
.inviteForm {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: stretch;
}

.formLabel {
  font-family: var(--font);
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(var(--ink-rgb), 0.7);
}

.formInput {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  background: rgba(var(--ink-rgb), 0.06);
  color: var(--white);
  font-family: var(--font);
  font-size: 1rem;
}

.formInput::placeholder {
  color: rgba(var(--ink-rgb), 0.4);
}

.formError {
  margin: 0;
  font-family: var(--font);
  font-size: 0.875rem;
  color: rgba(244, 67, 54, 0.9);
}

.primaryBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  border-radius: 14px !important;
  height: 48px !important;
  background: linear-gradient(135deg,
      rgba(26, 147, 111, 0.55) 0%,
      rgba(26, 147, 111, 0.35) 100%) !important;
  color: var(--white) !important;
}

.secondaryLink {
  text-align: center;
  font-family: var(--font);
  font-weight: 600;
  color: rgba(0, 168, 232, 0.95);
  text-decoration: none;
}

.secondaryLink:hover {
  text-decoration: underline;
}

.textBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  color: rgba(var(--ink-rgb), 0.65) !important;
}
</style>
