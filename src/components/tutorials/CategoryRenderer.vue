<template>
  <div :id="`category-${category.key}`" class="categoryCard" :class="{ expanded }">
    <button class="categoryHeader" @click="expanded = !expanded">
      <div class="categoryHeaderLeft">
        <v-icon size="22" :class="allFieldsDone ? 'categoryIconDone' : 'categoryIcon'">
          {{ allFieldsDone ? 'mdi-check-circle' : categoryIcons[category.key] || 'mdi-bookmark-outline' }}
        </v-icon>
        <span class="categoryName">{{ category.name }}</span>
      </div>
      <div class="categoryHeaderRight">
        <span class="categoryProgress">{{ doneCount }}/{{ category.fields.length }}</span>
        <v-icon size="20" class="expandIcon" :class="{ rotated: expanded }">mdi-chevron-down</v-icon>
      </div>
    </button>

    <v-expand-transition>
      <div v-show="expanded" class="categoryBody">
        <div v-for="field in sortedFields" :key="field.key" class="fieldCard" :class="{ fieldComplete: isFieldComplete(field.key) }">
          <div class="fieldHeader">
            <span class="fieldName">{{ field.name }}</span>
          </div>
          <FieldRenderer
            :field="field"
            :completed="isFieldComplete(field.key)"
            @toggle="$emit('toggleField', $event)"
          />
        </div>
      </div>
    </v-expand-transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import FieldRenderer from './FieldRenderer.vue'

const props = defineProps({
  category: { type: Object, required: true },
  completedFieldKeys: { type: Array, default: () => [] },
  startExpanded: { type: Boolean, default: false },
})
defineEmits(['toggleField'])

const expanded = ref(props.startExpanded)

watch(() => props.startExpanded, (val) => {
  if (val) expanded.value = true
})

const categoryIcons = {
  classes: 'mdi-google-classroom',
  points: 'mdi-medal-outline',
  shop: 'mdi-store-outline',
  groups_and_students: 'mdi-account-group-outline',
  teacher: 'mdi-account-tie-outline',
}

const sortedFields = computed(() =>
  [...props.category.fields].sort((a, b) => a.order - b.order)
)

function isFieldComplete(fieldKey) {
  return props.completedFieldKeys.includes(fieldKey)
}

const doneCount = computed(() =>
  props.category.fields.filter(f => isFieldComplete(f.key)).length
)

const allFieldsDone = computed(() =>
  doneCount.value === props.category.fields.length && props.category.fields.length > 0
)
</script>

<style scoped>
.categoryCard {
  border-radius: 16px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  background: rgba(var(--ink-rgb), 0.04);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  overflow: hidden;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.categoryCard.expanded {
  border-color: rgba(var(--freshSky-rgb), 0.3);
  box-shadow: 0 4px 24px rgba(var(--freshSky-rgb), 0.08);
}

.categoryHeader {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--white);
  transition: background 0.15s ease;
}

.categoryHeader:hover {
  background: rgba(var(--ink-rgb), 0.03);
}

.categoryHeaderLeft {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.categoryIcon {
  color: var(--freshSky);
}

.categoryIconDone {
  color: var(--seaGreen);
}

.categoryName {
  font-family: var(--font);
  font-weight: 600;
  font-size: 1.1rem;
}

.categoryHeaderRight {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.categoryProgress {
  font-family: var(--font);
  font-size: 0.8rem;
  color: rgba(var(--ink-rgb), 0.5);
  font-weight: 600;
}

.expandIcon {
  color: rgba(var(--ink-rgb), 0.5);
  transition: transform 0.25s ease;
}

.expandIcon.rotated {
  transform: rotate(180deg);
}

.categoryBody {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0 1.25rem 1.25rem;
}

.fieldCard {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 12px;
  background: rgba(var(--ink-rgb), 0.03);
  border: 1px solid rgba(var(--ink-rgb), 0.06);
  transition: background 0.3s ease, border-color 0.3s ease;
}

.fieldCard.fieldComplete {
  background: rgba(var(--seaGreen-rgb), 0.08);
  border-color: rgba(var(--seaGreen-rgb), 0.2);
}

.fieldHeader {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.fieldName {
  font-family: var(--font);
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--white);
}
</style>
