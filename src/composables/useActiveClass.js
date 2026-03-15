import { ref } from 'vue'

const activeClassId = ref(null)
const activeClassName = ref(null)

export function useActiveClass() {
  function setActiveClass(id, name) {
    activeClassId.value = id
    activeClassName.value = name
  }

  function clearActiveClass() {
    activeClassId.value = null
    activeClassName.value = null
  }

  return {
    activeClassId,
    activeClassName,
    setActiveClass,
    clearActiveClass,
  }
}
