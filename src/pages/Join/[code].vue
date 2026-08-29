<template>
  <div class="container joinPage">
    <div class="joinCard">
      <div v-if="previewLoading" class="stateRow">
        <v-progress-circular indeterminate color="primary" />
        <span>Loading invite...</span>
      </div>

      <template v-else-if="previewError">
        <h1 class="joinTitle">Invalid invite</h1>
        <p class="joinSubtitle">{{ previewError }}</p>
        <p class="helpText">Contact your school admin for a new link.</p>
      </template>

      <template v-else-if="preview">
        <h1 class="joinTitle">{{ headline }}</h1>
        <p class="joinSubtitle">{{ subcopy }}</p>

        <v-alert v-if="error" type="error" density="comfortable" class="joinAlert">{{ error }}</v-alert>

        <div v-if="!authReady" class="stateRow">
          <v-progress-circular indeterminate color="primary" />
          <span>Checking sign-in status...</span>
        </div>

        <div v-else-if="!isSignedIn" class="stateColumn">
          <v-btn class="joinBtn" prepend-icon="mdi-login" @click="goToLogin">Continue</v-btn>
        </div>

        <div v-else class="stateColumn">
          <div v-if="joining" class="stateRow">
            <v-progress-circular indeterminate color="primary" />
            <span>Joining {{ preview.school?.name }}...</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { fetchUserProfile } from '@/composables/useUserProfile'
import Server from '@/services/server'

const route = useRoute()
const router = useRouter()
const { authReady, isSignedIn } = useAuth()

const previewLoading = ref(true)
const previewError = ref('')
const preview = ref(null)
const joining = ref(false)
const error = ref('')

const inviteRole = computed(() => preview.value?.role || 'teacher')

const headline = computed(() => {
  const name = preview.value?.school?.name || 'your school'
  if (inviteRole.value === 'schoolAdmin') return `Set up ${name}`
  return `Join ${name}`
})

const subcopy = computed(() => {
  if (inviteRole.value === 'schoolAdmin') {
    return "You've been invited as a school administrator"
  }
  return "You've been invited as a teacher"
})

function goToLogin() {
  router.push({ path: '/Login', query: { redirect: route.fullPath } })
}

function redirectAfterJoin(role, schoolId) {
  if (role === 'teacher') {
    router.replace('/Classes?welcome=1')
    return
  }
  if (role === 'schoolAdmin') {
    router.replace({
      path: '/SchoolAdminOnboarding',
      query: { welcome: '1', ...(schoolId ? { schoolId } : {}) },
    })
  }
}

async function loadPreview() {
  const code = String(route.params.code || '')
  if (!code) {
    previewError.value = 'Invite code is missing'
    previewLoading.value = false
    return
  }
  previewLoading.value = true
  previewError.value = ''
  try {
    const result = await Server.previewJoinCode(code)
    preview.value = result
  } catch (e) {
    previewError.value =
      e.response?.data?.message || 'This invite link is invalid or has expired'
  } finally {
    previewLoading.value = false
  }
}

async function acceptInvite() {
  if (!isSignedIn.value || joining.value || !preview.value) return
  const code = String(route.params.code || '')
  if (!code) {
    error.value = 'Invite code is missing'
    return
  }
  joining.value = true
  error.value = ''
  try {
    const result = await Server.joinSchoolByCode(code)
    await fetchUserProfile()
    const role = result.membership?.role || inviteRole.value
    const schoolId = result.membership?.schoolId
    redirectAfterJoin(role, schoolId)
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Could not join school'
    joining.value = false
  }
}

onMounted(() => {
  loadPreview()
})

watch([authReady, isSignedIn], ([ready, signed]) => {
  if (ready && signed && preview.value && !joining.value) {
    acceptInvite()
  }
})
</script>

<style scoped>
.joinPage {
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.joinCard {
  width: 100%;
  max-width: 520px;
  padding: 1.5rem;
  border-radius: 20px;
  border: 1px solid rgba(var(--ink-rgb), 0.16);
  background: rgba(var(--color-bg-rgb), 0.5);
}

.joinTitle {
  margin: 0 0 0.5rem;
  font-family: var(--font);
  color: var(--white);
}

.joinSubtitle {
  margin: 0 0 1rem;
  font-family: var(--font);
  color: rgba(var(--ink-rgb), 0.7);
}

.helpText {
  margin: 0;
  font-family: var(--font);
  color: rgba(var(--ink-rgb), 0.6);
  font-size: 0.9375rem;
}

.joinAlert {
  margin-bottom: 1rem;
}

.stateRow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font);
}

.stateColumn {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-family: var(--font);
  color: rgba(var(--ink-rgb), 0.85);
}

.joinBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
}
</style>
