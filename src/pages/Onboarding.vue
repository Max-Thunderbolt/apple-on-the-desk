<template>
  <div class="container onboardingPage" :class="{ 'onboardingPage--child': isChild }">
    <div class="onboardingShell" :class="{ 'onboardingShell--child': isChild }">
      <TeacherNav v-if="!isChild" />

      <div v-if="loading && !loaded" class="loadingState">
        <v-progress-circular indeterminate color="primary" size="64" width="6" />
        <span class="loadingText">Loading...</span>
      </div>

      <template v-else-if="config">
        <header class="onboardingHeader">
          <div class="onboardingHeaderLeft">
            <h1 class="onboardingTitle">
              <span class="titleAccent">Tutorials</span>
            </h1>
            <p class="onboardingSubtitle">
              Tutorials are currently being reworked to reflect the latest changes to the platform.
              Thank you for your patience.
            </p>
          </div>
        </header>

        <div class="onboardingContent">
          <div class="tutorialNotice">
            <v-icon size="48" class="tutorialNoticeIcon">mdi-school-outline</v-icon>
            <h2 class="tutorialNoticeTitle">Coming soon</h2>
            <p class="tutorialNoticeText">
              Step-by-step guides for points, shop, and groups will return here shortly.
            </p>
          </div>

          <!--
          <p v-if="searchQuery && !filteredCategories.length" class="noResults">
            No results for "{{ searchQuery }}"
          </p>

          <div class="categoriesList">
            <CategoryRenderer
              v-for="category in filteredCategories"
              :key="category.key"
              :category="category"
              :completed-field-keys="progress?.completedFieldKeys || []"
              :start-expanded="category.key === focusedSection || !!searchQuery"
              @toggle-field="handleToggleField"
            />
          </div>

          <div class="searchBarContainer">
            <FloatingSearchBar ref="searchBarRef" v-model="searchQuery" placeholder="Search tutorials" />
          </div>
          -->
        </div>

        <div class="onboardingFooter">
          <v-btn v-if="cameFromClass" class="homeButton" variant="flat" @click="$router.push(classRoute)">
            <v-icon start size="18">mdi-arrow-left</v-icon>
            Back to {{ className }}
          </v-btn>
          <v-btn v-else class="homeButton" variant="flat" @click="$router.push('/Classes')">
            Back to Home
          </v-btn>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOnboarding } from '@/composables/useOnboarding'
import TeacherNav from '@/components/navigation/TeacherNav.vue'
// import CategoryRenderer from '@/components/tutorials/CategoryRenderer.vue'
// import FloatingSearchBar from '@/components/common/FloatingSearchBar.vue'

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
const classRoute = computed(() => (cameFromClass.value ? `/Class/${classId.value}` : '/'))

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

  return cats.map((cat) => {
    if (!inClassCategories.includes(cat.key)) return cat
    return {
      ...cat,
      fields: cat.fields.map((field) => ({
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
  return query.toLowerCase().split(/\s+/).filter((w) => w.length > 1 && !STOP_WORDS.has(w))
}

function scoreFieldMatch(field, cat, keywords) {
  const primary = [field.name, field.key].join(' ').toLowerCase()
  const context = [cat.name, cat.key].join(' ').toLowerCase()
  const sectionContent = (field.sections || []).flatMap((s) =>
    [s.label || '', s.warningText || '', ...(s.steps || [])],
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
    const inPrimary = variants.some((v) => primary.includes(v))
    const inContext = variants.some((v) => context.includes(v))
    const inSecondary = variants.some((v) => secondary.includes(v))

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

  return allMatched && anyPrimaryMatch ? score : 0
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
      .map((f) => {
        if (f.name.toLowerCase().includes(q)) return { field: f, score: 100 }
        if (!keywords.length) return null
        const s = scoreFieldMatch(f, cat, keywords)
        return s > 0 ? { field: f, score: s } : null
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)

    if (scored.length) {
      scoredFieldMatches.push({
        cat: { ...cat, fields: scored.map((s) => s.field) },
        topScore: scored[0].score,
      })
    }
  }

  scoredFieldMatches.sort((a, b) => b.topScore - a.topScore)
  return [...categoryMatches, ...scoredFieldMatches.map((s) => s.cat)]
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
    const allDone = cat.fields.every((f) =>
      progress.value.completedFieldKeys?.includes(f.key),
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
    searchBarRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    searchBarRef.value?.focus()
  } else if (focusedSection.value) {
    const el = document.getElementById(`category-${focusedSection.value}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
})
</script>

<style scoped>
.onboardingPage {
  align-items: stretch;
  justify-content: flex-start !important;
  padding-top: 1rem;
  padding-bottom: 3rem;
  gap: 0;
}

.onboardingPage--child {
  min-height: auto;
  padding: 0;
  background: transparent;
  background-image: none;
}

.onboardingShell {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.onboardingShell--child {
  max-width: none;
  padding: 0;
}

@media (min-width: 768px) {
  .onboardingShell:not(.onboardingShell--child) {
    padding: 0 1.5rem 3rem;
  }
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
  color: rgba(var(--ink-rgb), 0.85);
}

.onboardingHeader {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.onboardingHeaderLeft {
  min-width: 0;
  flex: 1;
}

.onboardingTitle {
  font-family: var(--font);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--white);
  margin: 0 0 0.35rem;
}

.onboardingSubtitle {
  font-family: var(--font);
  font-size: 0.95rem;
  color: rgba(var(--ink-rgb), 0.7);
  margin: 0;
  max-width: 36rem;
  line-height: 1.45;
}

.onboardingContent {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1rem;
}

.tutorialNotice {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.65rem;
  width: 100%;
  padding: 2.75rem 1.5rem;
  border-radius: 20px;
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  background: rgba(var(--ink-rgb), 0.04);
  backdrop-filter: blur(12px);
}

.tutorialNoticeIcon {
  color: rgba(var(--freshSky-rgb), 0.75);
  margin-bottom: 0.25rem;
}

.tutorialNoticeTitle {
  font-family: var(--font);
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--white);
  margin: 0;
}

.tutorialNoticeText {
  font-family: var(--font);
  font-size: 0.95rem;
  color: rgba(var(--ink-rgb), 0.65);
  margin: 0;
  max-width: 28rem;
  line-height: 1.45;
}

.categoriesList {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.onboardingFooter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.75rem 0 0;
  width: 100%;
}

.searchBarContainer {
  position: sticky;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0;
  width: 100%;
  z-index: 10;
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
  border: 1px solid rgba(var(--ink-rgb), 0.18) !important;
  border-radius: 14px !important;
}

.searchBarContainer :deep(.floatingSearchBar) {
  width: 100%;
  max-width: 700px;
}

.noResults {
  font-family: var(--font);
  font-size: 0.95rem;
  color: rgba(var(--ink-rgb), 0.45);
  text-align: center;
  padding: 2rem 1rem;
  margin: 0;
}
</style>
