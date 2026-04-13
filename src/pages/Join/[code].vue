<template>
  <div class="container joinPage">
    <div class="joinCard">
      <h1 class="joinTitle">School Invite</h1>
      <p class="joinSubtitle">Use this invite to join a school with the role attached to the code.</p>

      <v-alert v-if="error" type="error" density="comfortable" class="joinAlert">{{ error }}</v-alert>
      <v-alert v-if="success" type="success" density="comfortable" class="joinAlert">
        Joined <strong>{{ joinedSchoolName }}</strong> as <strong>{{ joinedRole }}</strong>.
      </v-alert>

      <div v-if="!authReady" class="stateRow">
        <v-progress-circular indeterminate color="primary" />
        <span>Checking sign-in status...</span>
      </div>

      <div v-else-if="!isSignedIn" class="stateColumn">
        <p>You need to sign in first to accept this invite.</p>
        <v-btn class="joinBtn" prepend-icon="mdi-login" @click="goToLogin">Sign in to continue</v-btn>
      </div>

      <div v-else class="stateColumn">
        <v-btn
          class="joinBtn"
          :loading="joining"
          :disabled="joining || success"
          prepend-icon="mdi-account-plus"
          @click="acceptInvite"
        >
          {{ success ? 'Invite accepted' : 'Join school now' }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { fetchUserProfile } from '@/composables/useUserProfile'
import Server from '@/services/server'

const route = useRoute()
const router = useRouter()
const { authReady, isSignedIn } = useAuth()

const joining = ref(false)
const success = ref(false)
const error = ref('')
const joinedSchoolName = ref('')
const joinedRole = ref('')

function goToLogin() {
  router.push({ path: '/Login', query: { redirect: route.fullPath } })
}

async function acceptInvite() {
  if (!isSignedIn.value || joining.value || success.value) return
  const code = String(route.params.code || '')
  if (!code) {
    error.value = 'Invite code is missing'
    return
  }
  joining.value = true
  error.value = ''
  try {
    const result = await Server.joinSchoolByCode(code)
    success.value = true
    joinedSchoolName.value = result.school?.name || 'school'
    joinedRole.value = result.membership?.role || 'member'
    await fetchUserProfile()
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Could not join school'
  } finally {
    joining.value = false
  }
}

onMounted(() => {
  if (authReady.value && isSignedIn.value) {
    acceptInvite()
  }
})

watch([authReady, isSignedIn], ([ready, signed]) => {
  if (ready && signed && !success.value && !joining.value) {
    acceptInvite()
  }
})
</script>

<style scoped>
@import '../../styles/style.css';

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
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(0, 23, 31, 0.5);
}

.joinTitle {
  margin: 0 0 0.5rem;
  font-family: var(--font);
  color: var(--white);
}

.joinSubtitle {
  margin: 0 0 1rem;
  font-family: var(--font);
  color: rgba(255, 255, 255, 0.7);
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
  color: rgba(255, 255, 255, 0.85);
}

.joinBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
}
</style>
