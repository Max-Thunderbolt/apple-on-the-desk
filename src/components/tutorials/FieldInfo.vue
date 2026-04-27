<template>
  <div class="fieldInfo">
    <p class="fieldDescription">{{ field.description }}</p>

    <div v-if="field.extraInfo" class="extraInfoBanner">
      <v-icon size="18" class="extraInfoIcon">mdi-information-outline</v-icon>
      <p class="extraInfoText">{{ field.extraInfo }}</p>
    </div>

    <template v-if="hasSections">
      <div class="sectionTabs">
        <button
          v-for="(section, i) in field.sections"
          :key="i"
          class="sectionTab"
          :class="{ active: activeSection === i }"
          @click="activeSection = i"
        >
          {{ section.label }}
        </button>
      </div>
      <StepsAndVideo
        :key="activeSection"
        :steps="field.sections[activeSection].steps"
        :video-url="field.sections[activeSection].videoUrl || videoUrls[activeSection] || null"
      />
      <div v-if="field.sections[activeSection].warningText" class="sectionWarningBanner">
        <v-icon size="18" class="sectionWarningIcon">mdi-alert-outline</v-icon>
        <p class="sectionWarningText">{{ field.sections[activeSection].warningText }}</p>
      </div>
    </template>

    <template v-else-if="hasStepsOrVideo">
      <StepsAndVideo :steps="field.steps" :video-url="videoUrls[0] || null" />
    </template>

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
        {{ completed ? 'Understood' : 'I understand' }}
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import StepsAndVideo from './StepsAndVideo.vue'

const props = defineProps({
  field: { type: Object, required: true },
  completed: { type: Boolean, default: false },
})
defineEmits(['toggle'])

const activeSection = ref(0)

const videoUrls = computed(() => {
  if (!props.field.videoUrl) return []
  return Array.isArray(props.field.videoUrl) ? props.field.videoUrl : [props.field.videoUrl]
})

const hasSections = computed(() => props.field.sections?.length > 0)
const hasStepsOrVideo = computed(() => props.field.steps?.length > 0 || videoUrls.value.length > 0)
</script>

<style scoped>
.fieldInfo {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.fieldDescription {
  font-family: var(--font);
  font-size: 0.9rem;
  color: rgba(var(--ink-rgb), 0.8);
  margin: 0;
  line-height: 1.5;
  white-space: pre-line;
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
  color: rgba(var(--ink-rgb), 0.75);
  margin: 0;
  line-height: 1.5;
}

.sectionTabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.sectionTab {
  font-family: var(--font);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(var(--ink-rgb), 0.15);
  background: rgba(var(--ink-rgb), 0.04);
  color: rgba(var(--ink-rgb), 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.sectionTab:hover {
  background: rgba(var(--ink-rgb), 0.08);
  color: rgba(var(--ink-rgb), 0.85);
}

.sectionTab.active {
  background: rgba(var(--freshSky-rgb), 0.2);
  border-color: rgba(var(--freshSky-rgb), 0.5);
  color: var(--freshSky);
}

.sectionWarningBanner {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(247, 183, 7, 0.08);
  border: 1px solid rgba(247, 183, 7, 0.25);
  border-radius: 12px;
}

.sectionWarningIcon {
  color: rgb(247, 183, 7);
  flex-shrink: 0;
  margin-top: 2px;
}

.sectionWarningText {
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.8);
  margin: 0;
  line-height: 1.5;
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
</style>
