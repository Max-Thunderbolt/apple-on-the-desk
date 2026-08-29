<template>
  <Teleport to="body">
    <div v-if="open" class="contextMenuBackdrop" :style="backdropStyle" @click="emit('close')">
      <div class="contextMenuPopover" :style="menuStyle" @click.stop>
        <template v-for="item in items" :key="item.key">
          <div
            v-if="item.children?.length"
            class="contextMenuItemRow"
            @mouseenter="activeSubmenuKey = item.key"
            @mouseleave="activeSubmenuKey = null"
          >
            <div
              class="contextMenuItem contextMenuItemHasChildren"
              :class="{ contextMenuItemDisabled: item.disabled }"
            >
              <v-icon v-if="item.icon" size="small">{{ item.icon }}</v-icon>
              <span class="contextMenuItemLabel">{{ item.label }}</span>
              <v-icon size="small" class="contextMenuChevron">mdi-chevron-right</v-icon>
            </div>
            <div
              v-show="activeSubmenuKey === item.key && !item.disabled"
              class="contextMenuSubmenu"
            >
              <button
                v-for="child in item.children"
                :key="child.key"
                class="contextMenuItem"
                :class="{ contextMenuItemDisabled: child.disabled }"
                :disabled="child.disabled"
                type="button"
                @click="onSelect(child)"
              >
                <v-icon v-if="child.icon" size="small">{{ child.icon }}</v-icon>
                <span>{{ child.label }}</span>
              </button>
            </div>
          </div>
          <button
            v-else
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
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

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
  zIndex: {
    type: Number,
    default: 2000,
  },
  items: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'select']);

const activeSubmenuKey = ref(null);

watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    activeSubmenuKey.value = null;
  }
});

const backdropStyle = computed(() => ({
  zIndex: props.zIndex,
}));

const menuStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
  minWidth: `${props.minWidth}px`,
  zIndex: props.zIndex + 1,
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
}

.contextMenuPopover {
  position: fixed;
  padding: 0.25rem 0;
  border-radius: 12px;
  border: 1px solid var(--color-border-soft);
  background: linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface-elevated) 100%);
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 28px var(--color-shadow);
}

.contextMenuItemRow {
  position: relative;
}

.contextMenuItem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  border: none;
  background: transparent;
  color: var(--color-text);
  padding: 0.55rem 0.8rem;
  cursor: pointer;
  font-family: var(--font);
  font-size: 0.84rem;
  text-align: left;
}

.contextMenuItemHasChildren {
  cursor: default;
}

.contextMenuItemLabel {
  flex: 1;
}

.contextMenuChevron {
  margin-left: auto;
  opacity: 0.7;
}

.contextMenuSubmenu {
  position: absolute;
  left: calc(100% - 4px);
  top: 0;
  min-width: 140px;
  max-height: min(280px, calc(100vh - 24px));
  overflow-y: auto;
  padding: 0.25rem 0;
  border-radius: 12px;
  border: 1px solid var(--color-border-soft);
  background: linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface-elevated) 100%);
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 28px var(--color-shadow);
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
    background: var(--color-surface-hover);
  }

  .contextMenuItemHasChildren:hover {
    background: var(--color-surface-hover);
  }

  .contextMenuItemDanger:hover:not(:disabled) {
    background: rgba(197, 40, 61, 0.2);
  }
}
</style>
