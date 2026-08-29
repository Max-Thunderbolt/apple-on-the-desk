<template>
  <v-snackbar
    v-model="visible"
    location="bottom"
    :timeout="-1"
    color="surface"
    class="pwaSnackbar"
    rounded="lg"
  >
    <div class="pwaContent">
      <img src="/apple-touch-icon.png" alt="" class="pwaIcon" width="40" height="40" />
      <div class="pwaText">
        <p class="pwaTitle">{{ title }}</p>
        <p class="pwaHint">{{ hint }}</p>
      </div>
    </div>
    <template #actions>
      <v-btn v-if="canNativeInstall" variant="flat" color="primary" class="pwaAction" @click="install">
        Install
      </v-btn>
      <v-btn variant="text" class="pwaAction" @click="dismiss">Not now</v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const visible = ref(false);
const canNativeInstall = ref(false);
const isIOS = ref(false);
const isStandalone = ref(false);

let deferredPrompt = null;

const title = computed(() => {
  if (canNativeInstall.value) return 'Install Apple On The Desk';
  if (isIOS.value) return 'Add to Home Screen';
  return 'Install Apple On The Desk';
});

const hint = computed(() => {
  if (canNativeInstall.value) return 'Open from your home screen like an app.';
  if (isIOS.value) {
    return 'Tap Share, then “Add to Home Screen”.';
  }
  return 'Install this app on your device for quick access.';
});

function dismiss() {
  visible.value = false;
  try {
    localStorage.setItem('pwa-install-dismissed', '1');
  } catch {
    /* ignore */
  }
}

async function install() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  canNativeInstall.value = false;
  if (outcome === 'accepted') dismiss();
}

onMounted(() => {
  const dismissed = (() => {
    try {
      return localStorage.getItem('pwa-install-dismissed') === '1';
    } catch {
      return false;
    }
  })();

  isStandalone.value =
    window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  if (isStandalone.value || dismissed) return;

  isIOS.value =
    /iPad|iPhone|iPod/.test(navigator.userAgent)
    && !window.MSStream;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    canNativeInstall.value = true;
    visible.value = true;
  });

  if (isIOS.value) {
    visible.value = true;
  }
});
</script>

<style scoped>
.pwaSnackbar :deep(.v-snackbar__wrapper) {
  border: 1px solid var(--color-border-soft);
  margin-bottom: 0.75rem;
}

.pwaContent {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: min(100%, 320px);
}

.pwaIcon {
  flex-shrink: 0;
  border-radius: 10px;
}

.pwaText {
  min-width: 0;
}

.pwaTitle {
  font-family: var(--font);
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text-strong);
  margin: 0;
}

.pwaHint {
  font-family: var(--font);
  font-size: 0.82rem;
  color: var(--color-text-muted);
  margin: 0.15rem 0 0;
  line-height: 1.35;
}

.pwaAction {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
}
</style>
