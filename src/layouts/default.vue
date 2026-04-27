<template>
  <v-main>
    <router-view />
  </v-main>
  <HelpButton :className="effectiveClassName" :classId="effectiveClassId"
    v-if="!['/Teacher', '/Onboarding', '/Login', '/Register', '/AdminDashboard', '/SchoolAdminDashboard'].includes(route.path)" />
  <AppFooter />
</template>

<script setup>
import HelpButton from '../components/navigation/helpButton.vue';
import TopNav from '../components/navigation/topNav.vue';
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import { useActiveClass } from '../composables/useActiveClass';

const route = useRoute();
const { activeClassId, activeClassName } = useActiveClass();

const isClassPage = computed(() => route.path.startsWith('/Class/'));
const effectiveClassId = computed(() => isClassPage.value ? activeClassId.value : null);
const effectiveClassName = computed(() =>
  isClassPage.value && activeClassName.value ? activeClassName.value : 'Classes'
);
</script>
