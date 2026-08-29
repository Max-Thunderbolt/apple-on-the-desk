<template>
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
</template>

<script setup>
import HelpButton from '../components/navigation/helpButton.vue';
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import { useActiveClass } from '../composables/useActiveClass';

const route = useRoute();
const { activeClassId, activeClassName } = useActiveClass();

const isClassPage = computed(() => route.path.startsWith('/Class/'));
const isClassesPage = computed(() => route.path === '/Classes');
const usesFloatingDock = computed(() => isClassPage.value || isClassesPage.value);
const effectiveClassId = computed(() => isClassPage.value ? activeClassId.value : null);
const effectiveClassName = computed(() =>
  isClassPage.value && activeClassName.value ? activeClassName.value : 'Classes'
);

const helpBottomOffset = 20;
</script>
