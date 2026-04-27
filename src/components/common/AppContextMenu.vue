<template>
  <Teleport to="body">
    <div v-if="open" class="contextMenuBackdrop" @click="emit('close')">
      <div class="contextMenuPopover" :style="menuStyle" @click.stop>
        <button
          v-for="item in items"
          :key="item.key"
          class="contextMenuItem"
          :class="{
            contextMenuItemDanger: item.danger,
            contextMenuItemDisabled: item.disabled,
          }"
          :disabled="item.disabled"
          type="button"
          @click="onSelect(item)"
        >
          <v-icon v-if="item.icon" size="small">{{ item.icon }}</v-icon>
          <span>{{ item.label }}</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  x: {
    type: Number,
    default: 0,
  },
  y: {
    type: Number,
    default: 0,
  },
  minWidth: {
    type: Number,
    default: 170,
  },
  items: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'select']);

const menuStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
  minWidth: `${props.minWidth}px`,
}));

function onSelect(item) {
  if (!item || item.disabled) return;
  emit('select', item.key);
  emit('close');
}
</script>

<style scoped>
.contextMenuBackdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
}

.contextMenuPopover {
  position: fixed;
  z-index: 2001;
  padding: 0.25rem 0;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(135deg, rgba(0, 23, 31, 0.94) 0%, rgba(0, 23, 31, 0.88) 100%);
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.38);
}

.contextMenuItem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.88);
  padding: 0.55rem 0.8rem;
  cursor: pointer;
  font-family: var(--font);
  font-size: 0.84rem;
  text-align: left;
}

.contextMenuItemDisabled {
  opacity: 0.6;
  cursor: wait;
}

.contextMenuItemDanger {
  color: var(--intenseCherry);
}

@media (hover: hover) {
  .contextMenuItem:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
  }

  .contextMenuItemDanger:hover:not(:disabled) {
    background: rgba(197, 40, 61, 0.2);
  }
}
</style>
