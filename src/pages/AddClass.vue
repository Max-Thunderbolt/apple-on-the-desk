<template>
    <div class="container addClassPage">
        <div class="addClassShell">
            <TeacherNav />
            <ClassForm @saved="onSaved" @cancel="onCancel" />
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import ClassForm from '../components/modals/ClassForm.vue';
import TeacherNav from '@/components/navigation/TeacherNav.vue';

const router = useRouter();

function onSaved() {
    router.push('/Classes');
}

function onCancel() {
    router.push('/Classes');
}
</script>

<style scoped>
.addClassPage {
    align-items: stretch;
    justify-content: flex-start !important;
    padding-top: 1rem;
    padding-bottom: 3rem;
}

.addClassShell {
    width: 100%;
    max-width: 700px;
    margin: 0 auto;
    padding: 0 1rem 2rem;
}
</style>
