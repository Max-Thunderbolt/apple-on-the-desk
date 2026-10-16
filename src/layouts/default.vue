<template>
  <TopNav v-if="shouldShowTopNav" />
  <v-main>
    <template v-if="showBillingUi">
      <BillingNoticeBanner
        v-if="lock.showBanner.value && lock.billingStatus.value"
        :status="lock.billingStatus.value.status"
        :school-name="lock.billingStatus.value.schoolName"
        :days-remaining="lock.daysRemaining.value"
        class="layoutBillingBanner"
      />
      <BillingSoftLockModal v-model="lock.showModal.value" />
    </template>
    <BillingHardLockGate
      v-if="showHardLockGate"
      :school-name="lock.billingStatus.value?.schoolName"
    />
    <router-view v-else />
  </v-main>
  <HelpButton
    v-if="isSignedIn"
    :className="effectiveClassName"
    :classId="effectiveClassId"
    :align-with-dock="usesFloatingDock"
    :bottom-offset="helpBottomOffset"
  />
  <PwaInstallPrompt />
</template>

<script setup>
import TopNav from '../components/navigation/topNav.vue';
import HelpButton from '../components/navigation/helpButton.vue';
import PwaInstallPrompt from '@/components/common/PwaInstallPrompt.vue';
import BillingNoticeBanner from '@/components/common/BillingNoticeBanner.vue';
import BillingSoftLockModal from '@/components/common/BillingSoftLockModal.vue';
import BillingHardLockGate from '@/components/common/BillingHardLockGate.vue';
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import { useActiveClass } from '../composables/useActiveClass';
import { useAuth } from '@/composables/useAuth';
import { useBillingLockCheck } from '@/composables/useBillingLockCheck';

const route = useRoute();
const { activeClassId, activeClassName } = useActiveClass();
const { isSignedIn, authReady } = useAuth();
const lock = useBillingLockCheck();

const PUBLIC_PATHS = new Set(['/', '/Login']);

const shouldShowTopNav = computed(() => {
  if (!authReady.value || !isSignedIn.value) return false;
  if (PUBLIC_PATHS.has(route.path) || route.path.startsWith('/Join/')) return false;
  return true;
});

// Billing banner/modal only inside the signed-in app chrome
const showBillingUi = computed(() => shouldShowTopNav.value);

// Classroom routes are replaced by the gate when hard-locked; Profile, billing and admin pages stay open.
function isClassroomRoute(path) {
  return path === '/Classes' || path === '/AddClass' || path.startsWith('/Class/') || path === '/MySchool';
}
const showHardLockGate = computed(
  () => showBillingUi.value && lock.blockAccess.value && isClassroomRoute(route.path),
);

const isClassPage = computed(() => route.path.startsWith('/Class/'));
const isClassesPage = computed(() => route.path === '/Classes');
const usesFloatingDock = computed(() => isClassPage.value || isClassesPage.value);
const effectiveClassId = computed(() => isClassPage.value ? activeClassId.value : null);
const effectiveClassName = computed(() =>
  isClassPage.value && activeClassName.value ? activeClassName.value : 'Classes'
);

const helpBottomOffset = 20;
</script>

<style scoped>
.layoutBillingBanner {
  margin: 0.75rem auto 0;
  max-width: 1100px;
  width: calc(100% - 2rem);
}
</style>
