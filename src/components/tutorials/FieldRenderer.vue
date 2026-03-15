<template>
  <component
    :is="componentMap[field.type] || componentMap.text"
    :field="field"
    :completed="completed"
    @toggle="$emit('toggle', $event)"
  />
</template>

<script setup>
import FieldChecklist from './FieldChecklist.vue'
import FieldText from './FieldText.vue'
import FieldWarning from './FieldWarning.vue'
import FieldDemoVideo from './FieldDemoVideo.vue'
import FieldInfo from './FieldInfo.vue'

defineProps({
  field: { type: Object, required: true },
  completed: { type: Boolean, default: false },
})
defineEmits(['toggle'])

const componentMap = {
  checklist: FieldChecklist,
  text: FieldText,
  warning: FieldWarning,
  demoVideo: FieldDemoVideo,
  info: FieldInfo,
}
</script>
