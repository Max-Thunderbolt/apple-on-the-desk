<template>
  <div v-if="students?.length" class="topStudentChips">
    <span
      v-for="(student, index) in students"
      :key="`${student.name}-${index}`"
      class="topStudentChip"
      :class="chipClass(index)"
      :title="`${student.name}: ${student.points ?? 0} pts`"
    >
      {{ student.name }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  students: {
    type: Array,
    default: () => [],
  },
});

function chipClass(index) {
  if (index === 0) return 'topStudentGold';
  if (index === 1) return 'topStudentSilver';
  return 'topStudentBronze';
}
</script>

<style scoped>
.topStudentChips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.topStudentChip {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topStudentGold {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.5), rgba(184, 134, 11, 0.5));
  color: #fff;
  border: 1px solid rgba(212, 175, 55, 0.6);
}

.topStudentSilver {
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.45), rgba(128, 128, 128, 0.45));
  color: #fff;
  border: 1px solid rgba(192, 192, 192, 0.6);
}

.topStudentBronze {
  background: linear-gradient(135deg, rgba(205, 127, 50, 0.5), rgba(139, 90, 43, 0.5));
  color: #fff;
  border: 1px solid rgba(205, 127, 50, 0.6);
}
</style>
