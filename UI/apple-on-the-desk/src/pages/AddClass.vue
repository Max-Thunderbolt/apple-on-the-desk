<template>
    <v-breadcrumbs density="compact" :items="breadcrumbs" class="breadcrumbs">
        <template v-slot:divider>
            <v-icon>mdi-chevron-right</v-icon>
        </template>
    </v-breadcrumbs>
    <ClassForm @saved="onSaved" @cancel="onCancel" />
</template>

<script setup>
import { useRouter } from 'vue-router';
import ClassForm from '../components/modals/ClassForm.vue';

const router = useRouter();

const breadcrumbs = [
    { title: 'Home', to: '/' },
    { title: 'Classes', to: '/Classes' },
    { title: 'Add class', to: '/AddClass' },
];

function onSaved() {
    router.push('/Classes');
}

function onCancel() {
    router.push('/Classes');
}
</script>

<style scoped>
@import '../styles/style.css';
</style>
