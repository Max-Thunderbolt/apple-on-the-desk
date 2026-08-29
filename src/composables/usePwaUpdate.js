import { ref } from 'vue';
import { registerSW } from 'virtual:pwa-register';

const needRefresh = ref(false);
let updateSW = null;

export function initPwaUpdate() {
  if (import.meta.env.DEV) return;

  updateSW = registerSW({
    onNeedRefresh() {
      needRefresh.value = true;
    },
    onOfflineReady() {
      /* assets cached */
    },
  });
}

export function usePwaUpdate() {
  function applyUpdate() {
    if (updateSW) updateSW(true);
    needRefresh.value = false;
  }

  return {
    needRefresh,
    applyUpdate,
  };
}
