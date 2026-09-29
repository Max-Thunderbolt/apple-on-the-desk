<template>
  <TopNav v-if="shouldShowTopNav" />
  <v-main>
    <router-view />
  </v-main>
  <HelpButton
    :className="effectiveClassName"
    :classId="effectiveClassId"
    :align-with-dock="usesFloatingDock"
    :bottom-offset="helpBottomOffset"
  />
  <AppFooter />
  <PwaInstallPrompt />
</template>

<script setup>
import TopNav from '../components/navigation/topNav.vue';
import HelpButton from '../components/navigation/helpButton.vue';
import AppFooter from '@/components/AppFooter.vue';
import PwaInstallPrompt from '@/components/common/PwaInstallPrompt.vue';
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import { useActiveClass } from '../composables/useActiveClass';
import { useAuth } from '@/composables/useAuth';

const route = useRoute();
const { activeClassId, activeClassName } = useActiveClass();
const { isSignedIn, authReady } = useAuth();

const PUBLIC_PATHS = new Set(['/', '/Login']);

const shouldShowTopNav = computed(() => {
  if (!authReady.value || !isSignedIn.value) return false;
  if (PUBLIC_PATHS.has(route.path) || route.path.startsWith('/Join/')) return false;
  return true;
});

const isClassPage = computed(() => route.path.startsWith('/Class/'));
const isClassesPage = computed(() => route.path === '/Classes');
const usesFloatingDock = computed(() => isClassPage.value || isClassesPage.value);
const effectiveClassId = computed(() => isClassPage.value ? activeClassId.value : null);
const effectiveClassName = computed(() =>
  isClassPage.value && activeClassName.value ? activeClassName.value : 'Classes'
);

const helpBottomOffset = 20;
</script>
