<template>
  <div class="fieldChecklist">
    <p class="fieldDescription">{{ field.description }}</p>
    <div v-if="field.extraInfo" class="extraInfoBanner">
      <v-icon size="18" class="extraInfoIcon">mdi-information-outline</v-icon>
      <p class="extraInfoText">{{ field.extraInfo }}</p>
    </div>
    <StepsAndVideo :steps="field.steps" :video-url="field.videoUrl" />
    <div class="fieldActions">
      <v-btn
        v-if="field.route"
        size="small"
        variant="outlined"
        class="goButton"
        @click="$router.push(field.route)"
      >
        {{ field.routeLabel || ('Go to ' + field.route.replace('/', '')) }}
        <v-icon end size="16">mdi-arrow-right</v-icon>
      </v-btn>
      <v-btn
        size="small"
        :variant="completed ? 'tonal' : 'flat'"
        :class="completed ? 'doneButton' : 'markDoneButton'"
        @click="$emit('toggle', field.key)"
      >
        <v-icon start size="16">{{ completed ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
        {{ completed ? 'Completed' : 'Mark as done' }}
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import StepsAndVideo from './StepsAndVideo.vue'

defineProps({
  field: { type: Object, required: true },
  completed: { type: Boolean, default: false },
})
defineEmits(['toggle'])
</script>

<style scoped>
.fieldChecklist {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.fieldDescription {
  font-family: var(--font);
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.5;
  white-space: pre-line;
}

.fieldActions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.goButton {
  font-family: var(--font) !important;
  text-transform: none !important;
  font-weight: 600 !important;
  border-color: rgba(var(--freshSky-rgb), 0.5) !important;
  color: var(--freshSky) !important;
  border-radius: 12px !important;
}

.markDoneButton {
  font-family: var(--font) !important;
  text-transform: none !important;
  font-weight: 600 !important;
  background: rgba(var(--seaGreen-rgb), 0.3) !important;
  color: var(--white) !important;
  border-radius: 12px !important;
}

.doneButton {
  font-family: var(--font) !important;
  text-transform: none !important;
  font-weight: 600 !important;
  background: rgba(var(--seaGreen-rgb), 0.15) !important;
  color: var(--seaGreen) !important;
  border-radius: 12px !important;
}

.extraInfoBanner {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(var(--freshSky-rgb), 0.08);
  border: 1px solid rgba(var(--freshSky-rgb), 0.25);
  border-radius: 12px;
}

.extraInfoIcon {
  color: var(--freshSky);
  flex-shrink: 0;
  margin-top: 2px;
}

.extraInfoText {
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
  line-height: 1.5;
}
</style>
