<template>
  <v-breadcrumbs v-if="!isChild" density="compact" :items="breadcrumbs" class="breadcrumbs">
    <template v-slot:divider>
      <v-icon>mdi-chevron-right</v-icon>
    </template>
  </v-breadcrumbs>

  <div class="container onboardingPage">
    <div v-if="loading && !loaded" class="loadingState">
      <v-progress-circular indeterminate color="primary" size="64" width="6" />
      <span class="loadingText">Loading...</span>
    </div>

    <template v-else-if="config">
      <div class="onboardingHeader">
        <div class="title">
          <span class="titleAccent">Tutorials</span>
        </div>
        <p class="onboardingSubtitle">
          Walk through each section to learn how Apple On The Desk works.
        </p>

        <div class="progressBarTutorials">
          <div class="progressTrack">
            <div class="progressFill" :style="{ width: progressPercent + '%' }" />
          </div>
          <span class="progressLabel">{{ completedFieldCount }} of {{ totalFieldCount }} steps</span>
        </div>
      </div>

      <p v-if="searchQuery && !filteredCategories.length" class="noResults">
        No results for "{{ searchQuery }}"
      </p>

      <div class="categoriesList">
        <CategoryRenderer v-for="category in filteredCategories" :key="category.key" :category="category"
          :completed-field-keys="progress?.completedFieldKeys || []"
          :start-expanded="category.key === focusedSection || !!searchQuery" @toggle-field="handleToggleField" />
      </div>

      <div class="searchBarContainer">
        <div class="searchBar" ref="searchBarRef">
          <v-icon size="20" class="searchIcon">mdi-magnify</v-icon>
          <input v-model="searchQuery" type="text" placeholder="Search tutorials" class="searchInput" />
          <button v-if="searchQuery" class="clearSearch" @click="searchQuery = ''">
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>
      </div>
      <div class="onboardingFooter">
        <div class="footerActions">
          <v-btn v-if="cameFromClass" class="homeButton" variant="flat" @click="$router.push(classRoute)">
            <v-icon start size="18">mdi-arrow-left</v-icon>
            Back to {{ className }}
          </v-btn>
          <v-btn v-else class="homeButton" variant="flat" @click="$router.push('/')">
            Back to Home
          </v-btn>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { useOnboarding } from '@/composables/useOnboarding'
import CategoryRenderer from '@/components/tutorials/CategoryRenderer.vue'

const route = useRoute()
const router = useRouter()

const {
  config,
  progress,
  loading,
  loaded,
  loadOnboarding,
  completeField,
  uncompleteField,
  isFieldComplete,
  completedFieldCount,
  totalFieldCount,
  dismissOnboarding,
} = useOnboarding()

const props = defineProps({
  isChild: { type: Boolean, default: false },
})

const isChild = computed(() => props.isChild)
const className = computed(() => route.query.className || 'Classes')
const classId = computed(() => route.query.classId || null)
const cameFromClass = computed(() => !!classId.value && className.value !== 'Classes')
const classRoute = computed(() => cameFromClass.value ? `/Class/${classId.value}` : '/')

const breadcrumbs = computed(() => {
  if (cameFromClass.value) {
    return [
      { title: className.value, to: classRoute.value },
      { title: 'Tutorials', to: route.fullPath },
    ]
  }
  return [
    { title: 'Home', to: '/' },
    { title: 'Tutorials', to: '/Onboarding' },
  ]
})

// watch(isChild, (newVal) => {
//   if (newVal) {
//     router.push('/Teacher')
//   }
// })

const inClassCategories = ['points', 'shop', 'groups_and_students']

const categoryRouteMap = {
  points: (id) => `/Class/${id}`,
  shop: (id) => `/Class/${id}?view=shop`,
  groups_and_students: (id) => `/Class/${id}?view=groups`,
}

const categoryRouteLabelMap = {
  points: (name) => `Open in ${name}`,
  shop: (name) => `Open Shop in ${name}`,
  groups_and_students: (name) => `Open Groups in ${name}`,
}

const focusedSection = computed(() => route.query.section || null)
const focusSearch = computed(() => route.query.section === 'search')
const searchQuery = ref('')
const searchBarRef = ref(null)

const sortedCategories = computed(() => {
  if (!config.value) return []
  const cats = [...config.value.categories].sort((a, b) => a.order - b.order)

  if (!cameFromClass.value) return cats

  return cats.map(cat => {
    if (!inClassCategories.includes(cat.key)) return cat
    return {
      ...cat,
      fields: cat.fields.map(field => ({
        ...field,
        route: categoryRouteMap[cat.key]?.(classId.value) || field.route,
        routeLabel: categoryRouteLabelMap[cat.key]?.(className.value),
      })),
    }
  })
})

const STOP_WORDS = new Set([
  'how', 'to', 'do', 'i', 'a', 'the', 'an', 'is', 'can', 'what',
  'where', 'when', 'does', 'my', 'in', 'on', 'for', 'it', 'of', 'and',
])

const SYNONYMS = {
  add: ['create', 'new', 'make'],
  create: ['add', 'new', 'make'],
  remove: ['delete', 'destroy'],
  delete: ['remove', 'destroy'],
  edit: ['update', 'change', 'modify', 'manage'],
  update: ['edit', 'change', 'modify'],
  change: ['edit', 'update', 'modify'],
  manage: ['edit', 'update', 'configure'],
  setup: ['configure', 'create', 'make'],
  configure: ['setup', 'edit', 'manage'],
  give: ['award', 'assign'],
  award: ['give', 'assign'],
  buy: ['purchase', 'shop', 'spend'],
  purchase: ['buy', 'shop', 'spend'],
  points: ['score', 'reward', 'rewards'],
  reward: ['points', 'prize'],
  rewards: ['points', 'prizes'],
  student: ['students', 'pupil', 'child', 'kid'],
  students: ['student', 'pupils', 'children', 'kids'],
  group: ['groups', 'team'],
  groups: ['group', 'teams'],
  class: ['classes', 'classroom'],
  classes: ['class', 'classrooms'],
  item: ['items', 'product'],
  items: ['item', 'products'],
}

function extractKeywords(query) {
  return query.toLowerCase().split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w))
}

function scoreFieldMatch(field, cat, keywords) {
  const primary = [field.name, field.key].join(' ').toLowerCase()
  const context = [cat.name, cat.key].join(' ').toLowerCase()
  const sectionContent = (field.sections || []).flatMap(s =>
    [s.label || '', s.warningText || '', ...(s.steps || [])]
  )
  const secondary = [
    field.description || '',
    field.extraInfo || '',
    ...(field.steps || []),
    ...sectionContent,
  ].join(' ').toLowerCase()

  let score = 0
  let allMatched = true
  let anyPrimaryMatch = false

  for (const kw of keywords) {
    const variants = [kw, ...(SYNONYMS[kw] || [])]
    const inPrimary = variants.some(v => primary.includes(v))
    const inContext = variants.some(v => context.includes(v))
    const inSecondary = variants.some(v => secondary.includes(v))

    if (inPrimary) {
      score += 10
      anyPrimaryMatch = true
    } else if (inContext) {
      score += 5
      anyPrimaryMatch = true
    } else if (inSecondary) {
      score += 1
    } else {
      allMatched = false
    }
  }

  return (allMatched && anyPrimaryMatch) ? score : 0
}

const filteredCategories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return sortedCategories.value

  const keywords = extractKeywords(q)
  const categoryMatches = []
  const scoredFieldMatches = []

  for (const cat of sortedCategories.value) {
    if (cat.name.toLowerCase().includes(q)) {
      categoryMatches.push(cat)
      continue
    }

    const scored = cat.fields
      .map(f => {
        if (f.name.toLowerCase().includes(q)) return { field: f, score: 100 }
        if (!keywords.length) return null
        const s = scoreFieldMatch(f, cat, keywords)
        return s > 0 ? { field: f, score: s } : null
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)

    if (scored.length) {
      scoredFieldMatches.push({
        cat: { ...cat, fields: scored.map(s => s.field) },
        topScore: scored[0].score,
      })
    }
  }

  scoredFieldMatches.sort((a, b) => b.topScore - a.topScore)
  return [...categoryMatches, ...scoredFieldMatches.map(s => s.cat)]
})

const progressPercent = computed(() => {
  if (!totalFieldCount.value) return 0
  return Math.round((completedFieldCount.value / totalFieldCount.value) * 100)
})

async function handleToggleField(fieldKey) {
  if (isFieldComplete(fieldKey)) {
    await uncompleteField(fieldKey)
  } else {
    await completeField(fieldKey)
    autoCompleteCategories()
  }
}

function autoCompleteCategories() {
  if (!config.value || !progress.value) return
  for (const cat of config.value.categories) {
    const allDone = cat.fields.every(f =>
      progress.value.completedFieldKeys?.includes(f.key)
    )
    if (allDone && !progress.value.completedCategoryKeys?.includes(cat.key)) {
      const keys = new Set(progress.value.completedCategoryKeys || [])
      keys.add(cat.key)
      progress.value = { ...progress.value, completedCategoryKeys: [...keys] }
    }
  }
}

async function handleDismiss() {
  await dismissOnboarding()
  router.push(classRoute.value)
}

onMounted(async () => {
  await loadOnboarding()
  await nextTick()
  if (focusSearch.value) {
    const input = searchBarRef.value?.querySelector('input')
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' })
      input.focus()
    }
  } else if (focusedSection.value) {
    const el = document.getElementById(`category-${focusedSection.value}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
})
</script>

<style scoped>
.onboardingPage {
  justify-content: flex-start !important;
  padding-top: 1rem;
  padding-bottom: 3rem;
  gap: 0;
  border-radius: 16px;
}

.loadingState {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
}

.loadingText {
  font-family: var(--font);
  color: rgba(255, 255, 255, 0.85);
}

.onboardingHeader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 700px;
  padding: 1rem 1rem 0;
}

.onboardingSubtitle {
  font-family: var(--font);
  font-size: clamp(0.95rem, 2vw, 1.1rem);
  color: rgba(255, 255, 255, 0.65);
  text-align: center;
  margin: 0;
}

.progressBarTutorials {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.progressTrack {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 100px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: linear-gradient(90deg, var(--freshSky), var(--seaGreen));
  border-radius: 100px;
  transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.progressLabel {
  font-family: var(--font);
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: right;
  font-weight: 600;
}

.categoriesList {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 700px;
  padding: 1.5rem 1rem;
}

.onboardingFooter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  width: 100%;
  max-width: 700px;
}

.searchBarContainer {
  position: sticky;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* gap: 0.75rem; */
  padding: 1rem;
  /* width: 100%; */
  height: 75%;
  max-width: 700px;
  /* padding-top: 2rem; */
  z-index: 10;
}

.footerActions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.skipButton {
  font-family: var(--font) !important;
  text-transform: none !important;
  font-weight: 600 !important;
  color: rgba(255, 255, 255, 0.5) !important;
  border-radius: 14px !important;
}

.skipButton:hover {
  color: var(--white) !important;
}

.homeButton {
  font-family: var(--font) !important;
  text-transform: none !important;
  font-weight: 600 !important;
  background: linear-gradient(135deg,
      rgba(0, 168, 232, 0.55) 0%,
      rgba(0, 168, 232, 0.35) 50%,
      rgba(0, 168, 232, 0.45) 100%) !important;
  color: var(--white) !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  border-radius: 14px !important;
}

.searchBar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  width: 100%;
  max-width: 700px;
  background: rgba(var(--freshSky-rgb), 0.6);
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  transition: border-color 0.2s ease;
}

.searchBar:focus-within {
  border-color: rgba(var(--freshSky-rgb), 0.45);
}

.searchIcon {
  color: rgba(255, 255, 255, 1);
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
}

.searchInput::placeholder {
  color: rgba(255, 255, 255, 1);
}

.clearSearch {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  cursor: pointer;
  color: rgba(255, 255, 255, 1);
  transition: background 0.15s ease;
}

.clearSearch:hover {
  background: rgba(255, 255, 255, 0.2);
}

.noResults {
  font-family: var(--font);
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.45);
  text-align: center;
  padding: 2rem 1rem;
  margin: 0;
}
</style>
