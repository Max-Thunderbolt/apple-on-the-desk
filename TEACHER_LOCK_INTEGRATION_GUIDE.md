# Teacher Lock Integration Guide

This guide explains how to integrate billing lock checks into existing teacher-facing classroom components to enforce write restrictions during soft/hard lock states.

## Quick Start

The `useBillingLockCheck` composable handles all billing status checks and provides flags and utilities for teacher views.

### Basic Integration Pattern

```vue
<script setup>
import { useBillingLockCheck } from '@/composables/useBillingLockCheck'
import BillingNoticeBanner from '@/components/common/BillingNoticeBanner.vue'
import BillingSoftLockModal from '@/components/common/BillingSoftLockModal.vue'
import BillingHardLockGate from '@/components/common/BillingHardLockGate.vue'

const { 
  billingStatus,
  isLocked,
  isSoftLocked,
  isHardLocked,
  showBanner,
  blockAccess,
  canWrite,
  daysRemaining,
  showModal,
  dismissModal,
  checkWriteAction
} = useBillingLockCheck()
</script>

<template>
  <div>
    <!-- Hard lock gate: blocks entire UI -->
    <BillingHardLockGate
      v-if="blockAccess"
      :school-name="billingStatus?.schoolName"
      school-admin-email="admin@school.co.za"
      logo-src="/path/to/logo.png"
    />

    <!-- Teacher UI (only shown when not hard locked) -->
    <div v-else>
      <!-- Banner: notice or soft lock warning -->
      <BillingNoticeBanner
        v-if="showBanner"
        :status="billingStatus?.status"
        :school-name="billingStatus?.schoolName"
        :days-remaining="daysRemaining"
        dismissible
      />

      <!-- Soft lock modal: once daily -->
      <BillingSoftLockModal v-model="showModal" />

      <!-- Your existing UI here -->
      <YourClassroomComponent :can-write="canWrite" />
    </div>
  </div>
</template>
```

---

## Protecting Write Actions

### Method 1: Check Before Action (Recommended)

Use `checkWriteAction()` before any write operation:

```js
async function awardPoints(categoryId, studentIds) {
  // Check if write is allowed
  const check = checkWriteAction('award points')
  if (!check.allowed) {
    toast.error(check.reason)
    return
  }

  // Proceed with normal logic
  try {
    await Server.awardPoints(classId, categoryId, studentIds)
    toast.success('Points awarded')
  } catch (e) {
    toast.error('Failed to award points')
  }
}
```

### Method 2: Disable UI Controls

Bind `:disabled` to `!canWrite`:

```vue
<v-btn 
  :disabled="!canWrite"
  @click="awardPoints"
>
  Award points
</v-btn>

<v-text-field 
  v-model="itemName"
  :disabled="!canWrite"
  label="Shop item name"
/>
```

### Method 3: Conditional Rendering

Hide write UI entirely when locked:

```vue
<v-btn 
  v-if="canWrite"
  @click="openAddStudentDialog"
>
  Add student
</v-btn>

<div v-else class="lockedMessage">
  <v-icon>mdi-lock-outline</v-icon>
  <span>{{ isSoftLocked ? 'Read-only during soft lock' : 'Contact school admin' }}</span>
</div>
```

---

## Components to Integrate

### High Priority (Write Actions)

1. **Award Points Component**
   - Block point award buttons when `!canWrite`
   - Show inline lock reason on click if blocked

2. **Shop Management**
   - Disable create/edit/delete shop items
   - Block purchase actions

3. **Student Management**
   - Block invite/add student
   - Block delete student
   - Block move student

4. **Class Settings**
   - Disable class edit/delete
   - Block group generation

### Lower Priority (Read-Only OK)

These views don't need write blocks but should show the banner:

- Class list view
- Student insights/progress
- Points history
- Purchase history

---

## Example: Protecting Shop Purchase

```vue
<script setup>
import { ref } from 'vue'
import { useBillingLockCheck } from '@/composables/useBillingLockCheck'
import { toast } from 'vue-sonner'
import Server from '@/services/server'

const { canWrite, checkWriteAction, isSoftLocked } = useBillingLockCheck()
const selectedStudents = ref([])
const selectedItems = ref([])
const purchasing = ref(false)

async function purchaseItems() {
  const check = checkWriteAction('shop purchase')
  if (!check.allowed) {
    toast.error(check.reason)
    return
  }

  purchasing.value = true
  try {
    await Server.purchaseItems(classId, selectedStudents.value, selectedItems.value)
    toast.success('Items purchased')
    selectedStudents.value = []
    selectedItems.value = []
  } catch (e) {
    toast.error('Failed to purchase items')
  } finally {
    purchasing.value = false
  }
}
</script>

<template>
  <div>
    <!-- Shop UI with lock indicators -->
    <v-btn
      :disabled="!canWrite || selectedStudents.length === 0 || selectedItems.length === 0"
      :loading="purchasing"
      @click="purchaseItems"
    >
      Purchase
      <v-tooltip v-if="!canWrite" activator="parent">
        {{ isSoftLocked 
          ? 'Shop purchases disabled during soft lock' 
          : 'Contact school admin to restore access' }}
      </v-tooltip>
    </v-btn>
  </div>
</template>
```

---

## Example: Class Component with Full Integration

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBillingLockCheck } from '@/composables/useBillingLockCheck'
import BillingNoticeBanner from '@/components/common/BillingNoticeBanner.vue'
import BillingSoftLockModal from '@/components/common/BillingSoftLockModal.vue'
import BillingHardLockGate from '@/components/common/BillingHardLockGate.vue'
import { toast } from 'vue-sonner'
import Server from '@/services/server'

const route = useRoute()
const classId = ref(route.params.id)

const { 
  billingStatus,
  showBanner,
  blockAccess,
  canWrite,
  daysRemaining,
  showModal,
  dismissModal,
  checkWriteAction,
  isSoftLocked
} = useBillingLockCheck()

const classData = ref(null)
const students = ref([])
const loading = ref(false)

async function awardPoints(categoryId, studentIds) {
  const check = checkWriteAction('award points')
  if (!check.allowed) {
    toast.error(check.reason)
    return
  }

  try {
    await Server.awardPoints(classId.value, categoryId, studentIds)
    toast.success('Points awarded')
    await loadClass()
  } catch (e) {
    toast.error('Failed to award points')
  }
}

async function loadClass() {
  loading.value = true
  try {
    const [cls, studs] = await Promise.all([
      Server.getClassById(classId.value),
      Server.getClassStudents(classId.value)
    ])
    classData.value = cls
    students.value = studs
  } catch (e) {
    toast.error('Failed to load class')
  } finally {
    loading.value = false
  }
}

onMounted(loadClass)
</script>

<template>
  <div class="classView">
    <!-- Hard lock gate: blocks entire view -->
    <BillingHardLockGate
      v-if="blockAccess"
      :school-name="billingStatus?.schoolName"
      school-admin-email="admin@school.co.za"
    />

    <!-- Class UI -->
    <div v-else class="classContent">
      <!-- Notice/soft lock banner -->
      <BillingNoticeBanner
        v-if="showBanner"
        :status="billingStatus?.status"
        :school-name="billingStatus?.schoolName"
        :days-remaining="daysRemaining"
        dismissible
      />

      <!-- Soft lock modal (once daily) -->
      <BillingSoftLockModal v-model="showModal" />

      <div v-if="loading" class="loading">
        <v-progress-circular indeterminate />
      </div>

      <div v-else-if="classData">
        <h1>{{ classData.name }}</h1>

        <!-- Read-only view always works -->
        <StudentList :students="students" />

        <!-- Write actions check canWrite -->
        <div class="actions">
          <v-btn 
            :disabled="!canWrite"
            @click="openAwardPointsDialog"
          >
            Award points
            <v-tooltip v-if="!canWrite" activator="parent">
              {{ isSoftLocked 
                ? 'Points disabled during soft lock — contact school admin' 
                : 'Contact school admin to restore access' }}
            </v-tooltip>
          </v-btn>

          <v-btn
            v-if="canWrite"
            @click="openShopDialog"
          >
            Shop
          </v-btn>
          <div v-else class="lockedHint">
            <v-icon size="16">mdi-lock-outline</v-icon>
            <span>Shop paused — contact school admin</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lockedHint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.5);
}
</style>
```

---

## Testing Lock States Locally

To test the UI without backend lock enforcement, mock the billing status:

```js
// In your component or test file
import { useBillingStatus } from '@/composables/useBillingStatus'

const { clearCache } = useBillingStatus()

// Mock soft lock
const mockSoftLock = {
  status: 'soft_locked',
  schoolName: 'Test School',
  softLockedAt: new Date().toISOString(),
}

// Mock hard lock
const mockHardLock = {
  status: 'locked',
  schoolName: 'Test School',
  lockedAt: new Date().toISOString(),
}

// In your test or dev tools
billingStatus.value = mockSoftLock  // or mockHardLock
```

---

## Checklist for Each Component

When adding lock integration to a component:

- [ ] Import `useBillingLockCheck`
- [ ] Add `BillingNoticeBanner` above content (if teacher-facing page)
- [ ] Add `BillingSoftLockModal` component
- [ ] Add `BillingHardLockGate` wrapper (if top-level route)
- [ ] Identify all write actions (create, update, delete, award, purchase)
- [ ] Add `checkWriteAction()` before each write action
- [ ] Disable or hide write UI when `!canWrite`
- [ ] Show lock reason in tooltips or inline messages
- [ ] Test soft lock: banner + modal + writes blocked
- [ ] Test hard lock: gate blocks entire UI
- [ ] Test notice: banner only, writes still allowed

---

## API Mocking for Development

If API is not ready yet, add temporary mock in `server.js`:

```js
async getSchoolBillingStatus(schoolId) {
  // TODO: Remove mock when API ready
  if (import.meta.env.DEV) {
    return {
      status: 'paid', // Change to 'soft_locked' or 'locked' for testing
      pilot: false,
      schoolName: 'Dev School',
      termLabel: 'Term 3 2026',
      learnerCount: 50,
      dueDate: null,
      lastPaidAt: new Date().toISOString(),
    }
  }

  // Real API call
  try {
    const response = await this.http.get(`/schools/${encodeURIComponent(schoolId)}/billing`)
    return response.data
  } catch (error) {
    console.error('Error getting school billing status:', error)
    throw error
  }
}
```

---

## Summary

1. **Top-level routes** (e.g. `/Class/:id`) wrap entire view with `BillingHardLockGate`
2. **All teacher pages** show `BillingNoticeBanner` when `showBanner` is true
3. **All write actions** check `canWrite` or call `checkWriteAction()` before execution
4. **Inline feedback** via tooltips or disabled state explains why action is blocked
5. **Data is safe** copy on all lock surfaces

This ensures billing lock ladder enforcement without breaking read-only access during soft lock or blocking critical access to billing/export during hard lock (school admin only).
