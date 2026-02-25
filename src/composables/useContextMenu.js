import { ref } from 'vue';

/**
 * Reusable context menu state and helpers. Use in components that show
 * a context menu positioned at click coordinates.
 */
export function useContextMenu() {
    const isOpen = ref(false);
    const x = ref(0);
    const y = ref(0);
    const target = ref(null);

    function open(event, item) {
        target.value = item;
        x.value = event.clientX;
        y.value = event.clientY;
        isOpen.value = true;
    }

    function close() {
        isOpen.value = false;
        target.value = null;
    }

    return { isOpen, x, y, target, open, close };
}
