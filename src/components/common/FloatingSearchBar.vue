<template>
    <div class="floatingSearchBar" :class="{ 'floatingSearchBar--compact': compact }" ref="rootRef">
        <v-icon size="20" class="searchIcon">mdi-magnify</v-icon>
        <input
            ref="inputRef"
            :value="modelValue"
            type="text"
            :placeholder="placeholder"
            class="searchInput"
            @input="onInput"
            @focus="emit('focus')"
        />
        <button v-if="modelValue" type="button" class="clearSearch" aria-label="Clear search" @click="clear">
            <v-icon size="18">mdi-close</v-icon>
        </button>
    </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
    modelValue: {
        type: String,
        default: '',
    },
    placeholder: {
        type: String,
        default: 'Search',
    },
    compact: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['update:modelValue', 'focus']);

const rootRef = ref(null);
const inputRef = ref(null);

function onInput(event) {
    emit('update:modelValue', event.target.value);
}

function clear() {
    emit('update:modelValue', '');
    inputRef.value?.focus();
}

function focus() {
    inputRef.value?.focus();
}

function scrollIntoView(options) {
    rootRef.value?.scrollIntoView(options);
}

defineExpose({ focus, scrollIntoView, rootRef, inputRef });
</script>

<style scoped>
.floatingSearchBar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1rem;
    width: 100%;
    background: rgba(var(--freshSky-rgb), 0.6);
    border-radius: 999px;
    border: 1px solid rgba(var(--ink-rgb), 0.45);
    transition: border-color 0.2s ease;
}

.floatingSearchBar:focus-within {
    border-color: rgba(var(--freshSky-rgb), 0.45);
}

.floatingSearchBar--compact {
    width: auto;
    max-width: 220px;
    min-width: 140px;
    padding: 0.45rem 0.75rem;
    gap: 0.35rem;
    background: rgba(var(--ink-rgb), 0.12);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(var(--ink-rgb), 0.18);
    box-shadow: 0 8px 32px rgba(var(--shadow-rgb), 0.28);
}

.floatingSearchBar--compact .searchIcon {
    font-size: 16px !important;
}

.floatingSearchBar--compact .searchInput {
    font-size: 0.82rem;
}

.floatingSearchBar--compact .clearSearch {
    width: 20px;
    height: 20px;
}

.searchIcon {
    color: rgba(var(--ink-rgb), 1);
    flex-shrink: 0;
}

.searchInput {
    width: 100%;
    font-family: var(--font);
    font-size: 0.95rem;
    color: var(--white);
    background: transparent;
    border: none;
    outline: none;
    min-width: 0;
}

.searchInput::placeholder {
    color: rgba(var(--ink-rgb), 1);
}

.clearSearch {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--ink-rgb), 0.1);
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    cursor: pointer;
    color: rgba(var(--ink-rgb), 1);
    transition: background 0.15s ease;
}

.clearSearch:hover {
    background: rgba(var(--ink-rgb), 0.2);
}

:root[data-theme='light'] .floatingSearchBar--compact {
    background: rgba(255, 255, 255, 0.72);
    border-color: rgba(13, 37, 48, 0.12);
    box-shadow: 0 8px 28px rgba(13, 37, 48, 0.12);
}

:root[data-theme='light'] .floatingSearchBar {
    background: rgba(255, 255, 255, 0.96);
    border-color: rgba(13, 37, 48, 0.2);
    box-shadow: 0 4px 16px rgba(13, 37, 48, 0.08);
}

:root[data-theme='light'] .searchInput {
    color: rgba(13, 37, 48, 0.88);
}

:root[data-theme='light'] .searchInput::placeholder {
    color: rgba(13, 37, 48, 0.45);
}

:root[data-theme='light'] .searchIcon,
:root[data-theme='light'] .clearSearch {
    color: rgba(13, 37, 48, 0.65);
}
</style>
