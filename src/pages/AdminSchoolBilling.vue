<template>
  <div class="container adminBillingPage">
    <div class="adminBillingShell">
      <AdminNav />

      <header class="adminHeader">
        <div class="adminHeaderLeft">
          <p class="adminEyebrow">Platform administration</p>
          <h1 class="adminTitle">
            School <span class="titleAccent">billing</span>
          </h1>
          <p class="adminSubtitle">
            {{ school?.name || 'Loading...' }} — billing status, invoices, and payment management
          </p>
        </div>
        <div class="headerActions">
          <v-btn size="small" variant="outlined" prepend-icon="mdi-arrow-left" @click="goBack">
            Schools
          </v-btn>
          <v-btn class="refreshBtn" size="small" :loading="loading" icon="mdi-refresh" variant="flat"
            @click="loadData" />
        </div>
      </header>

      <v-alert v-if="error" type="error" variant="tonal" class="adminAlert" rounded="lg" closable
        @click:close="error = ''">
        {{ error }}
      </v-alert>

      <v-alert v-if="successMsg" type="success" variant="tonal" class="adminAlert" rounded="lg" closable
        @click:close="successMsg = ''">
        {{ successMsg }}
      </v-alert>

      <div v-if="loading && !billingStatus" class="loadingWrap">
        <v-progress-circular indeterminate color="primary" size="48" width="4" />
      </div>

      <template v-if="billingStatus">
        <!-- Status & controls -->
        <section class="statusPanel">
          <div class="statusHead">
            <div>
              <h2 class="statusTitle">Current status</h2>
              <div class="statusRow">
                <BillingStatusChip :status="billingStatus.status" :pilot="billingStatus.pilot" />
                <span v-if="billingStatus.termLabel" class="termLabel">{{ billingStatus.termLabel }}</span>
              </div>
            </div>
          </div>

          <div class="statusDetails">
            <div class="statusDetailRow">
              <span class="statusDetailLabel">Learner count (snapshot)</span>
              <span class="statusDetailValue">{{ billingStatus.learnerCount || 0 }}</span>
            </div>
            <div v-if="billingStatus.dueDate" class="statusDetailRow">
              <span class="statusDetailLabel">Due date</span>
              <span class="statusDetailValue">{{ formatDate(billingStatus.dueDate) }}</span>
            </div>
            <div v-if="billingStatus.lastPaidAt" class="statusDetailRow">
              <span class="statusDetailLabel">Last paid</span>
              <span class="statusDetailValue">{{ formatDate(billingStatus.lastPaidAt) }}</span>
            </div>
            <div v-if="billingStatus.noticeStartedAt" class="statusDetailRow">
              <span class="statusDetailLabel">Notice started</span>
              <span class="statusDetailValue">{{ formatDate(billingStatus.noticeStartedAt) }}</span>
            </div>
            <div v-if="billingStatus.softLockedAt" class="statusDetailRow">
              <span class="statusDetailLabel">Soft locked</span>
              <span class="statusDetailValue">{{ formatDate(billingStatus.softLockedAt) }}</span>
            </div>
            <div v-if="billingStatus.lockedAt" class="statusDetailRow">
              <span class="statusDetailLabel">Hard locked</span>
              <span class="statusDetailValue">{{ formatDate(billingStatus.lockedAt) }}</span>
            </div>
          </div>

          <div class="statusActions">
            <v-btn v-if="billingStatus.pilot" variant="outlined" size="small" prepend-icon="mdi-toggle-switch"
              @click="openConvertDialog">
              Convert to paid
            </v-btn>
            <v-btn v-if="billingStatus.status === 'trial' && !billingStatus.pilot" variant="outlined" size="small"
              prepend-icon="mdi-receipt-text-plus-outline" @click="openGenerateInvoiceDialog">
              Generate invoice
            </v-btn>
            <v-btn v-if="currentInvoice && !currentInvoice.paid" variant="outlined" size="small" color="success"
              prepend-icon="mdi-check-circle-outline" @click="openMarkPaidDialog">
              Mark paid
            </v-btn>
            <v-btn v-if="billingStatus.status === 'invoiced' && isOverdue" variant="outlined" size="small" color="warning"
              prepend-icon="mdi-alert-circle-outline" @click="openStartNoticeDialog">
              Start notice
            </v-btn>
            <v-btn v-if="billingStatus.status === 'notice'" variant="outlined" size="small" color="warning"
              prepend-icon="mdi-lock-open-variant-outline" @click="openSoftLockDialog">
              Apply soft lock
            </v-btn>
            <v-btn v-if="billingStatus.status === 'soft_locked'" variant="outlined" size="small" color="error"
              prepend-icon="mdi-lock-outline" @click="openHardLockDialog">
              Apply hard lock
            </v-btn>
            <v-btn v-if="['soft_locked', 'locked'].includes(billingStatus.status)" variant="outlined" size="small"
              color="success" prepend-icon="mdi-lock-open-outline" @click="openResumeDialog">
              Resume access
            </v-btn>
          </div>
        </section>

        <!-- Invoice history -->
        <section class="invoicesPanel">
          <div class="panelHead">
            <h2 class="sectionTitle">Invoice history</h2>
            <span class="tableBadge">{{ invoices.length }}</span>
            <v-spacer />
            <v-btn size="small" variant="outlined" prepend-icon="mdi-receipt-text-plus-outline"
              @click="openGenerateInvoiceDialog">
              Generate new invoice
            </v-btn>
          </div>

          <div v-if="invoices.length" class="invoicesTable">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Term</th>
                  <th>Issue date</th>
                  <th>Due date</th>
                  <th>Learners</th>
                  <th class="num">Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="inv in invoices" :key="inv.id" class="invoiceRow">
                  <td><code class="invoiceCode">{{ inv.invoiceNumber }}</code></td>
                  <td>{{ inv.termLabel }}</td>
                  <td>{{ formatDate(inv.issueDate) }}</td>
                  <td>{{ formatDate(inv.dueDate) }}</td>
                  <td class="num">{{ inv.learnerCount }}</td>
                  <td class="num amountCell">{{ formatZAR(inv.amountDue) }}</td>
                  <td>
                    <span class="invoiceStatus" :class="inv.paid ? 'invoiceStatus--paid' : 'invoiceStatus--unpaid'">
                      {{ inv.paid ? 'Paid' : 'Unpaid' }}
                    </span>
                  </td>
                  <td class="actionsCell">
                    <v-btn size="x-small" variant="text" icon="mdi-download" @click="downloadInvoice(inv.id)" />
                    <v-btn v-if="!inv.paid && inv.emailSent" size="x-small" variant="text" icon="mdi-email-sync-outline"
                      @click="resendInvoice(inv.id)" />
                    <v-btn v-if="!inv.paid" size="x-small" variant="text" icon="mdi-check-circle-outline"
                      @click="markInvoicePaid(inv)" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="emptyState">
            <v-icon size="48" class="emptyIcon">mdi-receipt-text-outline</v-icon>
            <p class="emptyTitle">No invoices yet</p>
            <p class="emptyText">Generate the first invoice for this school to begin billing.</p>
          </div>
        </section>

        <!-- Audit log -->
        <section v-if="auditLog.length" class="auditPanel">
          <div class="panelHead">
            <h2 class="sectionTitle">Billing audit log</h2>
            <span class="tableBadge">{{ auditLog.length }}</span>
          </div>

          <div class="auditLog">
            <div v-for="entry in auditLog" :key="entry.id" class="auditEntry">
              <div class="auditEntryHead">
                <span class="auditAction">{{ entry.action }}</span>
                <span class="auditTime">{{ formatDateTime(entry.timestamp) }}</span>
              </div>
              <p class="auditNote">{{ entry.note }}</p>
              <p class="auditUser">By {{ entry.adminName || entry.adminEmail }}</p>
            </div>
          </div>
        </section>
      </template>

      <!-- Generate invoice dialog -->
      <v-dialog v-model="generateDialogOpen" max-width="560" persistent>
        <v-card class="actionDialog">
          <v-card-title class="dialogTitle">Generate invoice</v-card-title>
          <v-card-text class="dialogText">
            <p class="dialogDesc">Create a new term invoice for {{ school?.name }}.</p>
            <div class="dialogFields">
              <v-select v-model="generateForm.term" :items="termItems" label="Term" density="compact" variant="outlined"
                class="glassField" hide-details />
              <v-text-field v-model.number="generateForm.year" label="Year" type="number" density="compact"
                variant="outlined" class="glassField" hide-details />
              <v-text-field v-model.number="generateForm.learnerCount" label="Learner count" type="number"
                density="compact" variant="outlined" class="glassField" hide-details />
              <v-text-field v-model.number="generateForm.ratePerLearner" label="Rate per learner (ZAR)" type="number"
                density="compact" variant="outlined" class="glassField" hide-details />
            </div>
            <div class="dialogSummary">
              <span>Total amount:</span>
              <strong>{{ formatZAR(generateTotal) }}</strong>
            </div>
          </v-card-text>
          <v-card-actions class="dialogActions">
            <v-spacer />
            <v-btn variant="text" :disabled="generatingInvoice" @click="closeGenerateDialog">Cancel</v-btn>
            <v-btn color="primary" :loading="generatingInvoice" @click="confirmGenerateInvoice">
              Generate &amp; send
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Mark paid dialog -->
      <v-dialog v-model="markPaidDialogOpen" max-width="480" persistent>
        <v-card class="actionDialog">
          <v-card-title class="dialogTitle">Mark invoice paid</v-card-title>
          <v-card-text class="dialogText">
            <p class="dialogDesc">
              Confirm payment received for invoice <code>{{ selectedInvoice?.invoiceNumber }}</code> 
              ({{ formatZAR(selectedInvoice?.amountDue) }}).
            </p>
            <v-text-field v-model="markPaidNote" label="Payment note (optional)" density="compact" variant="outlined"
              class="glassField" hide-details placeholder="e.g. EFT received, confirmed via bank" />
          </v-card-text>
          <v-card-actions class="dialogActions">
            <v-spacer />
            <v-btn variant="text" :disabled="markingPaid" @click="closeMarkPaidDialog">Cancel</v-btn>
            <v-btn color="success" :loading="markingPaid" @click="confirmMarkPaid">
              Mark paid
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Status change dialogs -->
      <v-dialog v-model="statusDialogOpen" max-width="520" persistent>
        <v-card class="actionDialog">
          <v-card-title class="dialogTitle">{{ statusDialogTitle }}</v-card-title>
          <v-card-text class="dialogText">
            <p class="dialogDesc">{{ statusDialogMessage }}</p>
            <v-textarea v-model="statusChangeNote" label="Audit note (required)" density="compact" variant="outlined"
              class="glassField" hide-details rows="3" placeholder="Reason for this status change" />
          </v-card-text>
          <v-card-actions class="dialogActions">
            <v-spacer />
            <v-btn variant="text" :disabled="changingStatus" @click="closeStatusDialog">Cancel</v-btn>
            <v-btn :color="statusDialogColor" :loading="changingStatus" :disabled="!statusChangeNote.trim()"
              @click="confirmStatusChange">
              {{ statusDialogAction }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import Server from '@/services/server'
import AdminNav from '@/components/admin/AdminNav.vue'
import BillingStatusChip from '@/components/common/BillingStatusChip.vue'

const route = useRoute()
const router = useRouter()
const schoolId = computed(() => route.query.schoolId)

const loading = ref(false)
const error = ref('')
const successMsg = ref('')
const school = ref(null)
const billingStatus = ref(null)
const invoices = ref([])
const auditLog = ref([])

const generateDialogOpen = ref(false)
const generateForm = ref({
  term: 1,
  year: new Date().getFullYear(),
  learnerCount: 0,
  ratePerLearner: 60,
})
const generatingInvoice = ref(false)

const markPaidDialogOpen = ref(false)
const selectedInvoice = ref(null)
const markPaidNote = ref('')
const markingPaid = ref(false)

const statusDialogOpen = ref(false)
const statusDialogType = ref('')
const statusChangeNote = ref('')
const changingStatus = ref(false)

const termItems = [
  { title: 'Term 1 (Jan–Apr)', value: 1 },
  { title: 'Term 2 (May–Aug)', value: 2 },
  { title: 'Term 3 (Sep–Dec)', value: 3 },
]

const currentInvoice = computed(() => invoices.value[0] || null)

const isOverdue = computed(() => {
  if (!currentInvoice.value?.dueDate) return false
  return new Date(currentInvoice.value.dueDate) < new Date()
})

const generateTotal = computed(() => {
  return (generateForm.value.learnerCount || 0) * (generateForm.value.ratePerLearner || 0)
})

const statusDialogTitle = computed(() => {
  const titles = {
    convert: 'Convert pilot to paid',
    notice: 'Start payment notice',
    soft_lock: 'Apply soft lock',
    hard_lock: 'Apply hard lock',
    resume: 'Resume access',
  }
  return titles[statusDialogType.value] || 'Change status'
})

const statusDialogMessage = computed(() => {
  const messages = {
    convert: 'Convert this pilot school to paid status. They will be billed from the next term.',
    notice: 'Start the 14-day payment notice period. Teachers will see a warning banner.',
    soft_lock: 'Apply soft lock. Teachers can view classes but cannot award points or make changes.',
    hard_lock: 'Apply hard lock. Classroom access will be fully paused for teachers.',
    resume: 'Resume full access. Typically done after payment is received.',
  }
  return messages[statusDialogType.value] || ''
})

const statusDialogAction = computed(() => {
  const actions = {
    convert: 'Convert',
    notice: 'Start notice',
    soft_lock: 'Apply soft lock',
    hard_lock: 'Apply hard lock',
    resume: 'Resume access',
  }
  return actions[statusDialogType.value] || 'Confirm'
})

const statusDialogColor = computed(() => {
  if (statusDialogType.value === 'resume') return 'success'
  if (['hard_lock', 'soft_lock'].includes(statusDialogType.value)) return 'error'
  if (statusDialogType.value === 'notice') return 'warning'
  return 'primary'
})

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('en-ZA', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

function formatZAR(amount) {
  if (typeof amount !== 'number') return 'R 0'
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount)
}

async function loadData() {
  if (!schoolId.value) {
    error.value = 'No school selected'
    return
  }

  error.value = ''
  loading.value = true

  try {
    const [schoolsData, billing, invoicesData] = await Promise.all([
      Server.listAdminSchools(),
      Server.getSchoolBillingStatus(schoolId.value),
      Server.getSchoolInvoices(schoolId.value),
    ])

    school.value = (schoolsData.schools || []).find(s => s.id === schoolId.value)
    billingStatus.value = billing
    invoices.value = invoicesData.invoices || []
    auditLog.value = billing.auditLog || []
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to load billing data'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/AdminSchools')
}

function openGenerateInvoiceDialog() {
  generateForm.value.learnerCount = billingStatus.value?.learnerCount || 0
  generateDialogOpen.value = true
}

function closeGenerateDialog() {
  generateDialogOpen.value = false
  generateForm.value = {
    term: 1,
    year: new Date().getFullYear(),
    learnerCount: 0,
    ratePerLearner: 60,
  }
}

async function confirmGenerateInvoice() {
  generatingInvoice.value = true
  error.value = ''

  try {
    await Server.generateInvoice(schoolId.value, generateForm.value)
    successMsg.value = 'Invoice generated and sent'
    closeGenerateDialog()
    await loadData()
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to generate invoice'
  } finally {
    generatingInvoice.value = false
  }
}

function markInvoicePaid(invoice) {
  selectedInvoice.value = invoice
  markPaidDialogOpen.value = true
}

function closeMarkPaidDialog() {
  markPaidDialogOpen.value = false
  selectedInvoice.value = null
  markPaidNote.value = ''
}

async function confirmMarkPaid() {
  if (!selectedInvoice.value) return
  markingPaid.value = true
  error.value = ''

  try {
    await Server.markInvoicePaid(selectedInvoice.value.id, {
      note: markPaidNote.value.trim() || 'Marked paid by platform admin',
    })
    successMsg.value = 'Invoice marked as paid'
    closeMarkPaidDialog()
    await loadData()
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to mark invoice paid'
  } finally {
    markingPaid.value = false
  }
}

async function downloadInvoice(invoiceId) {
  try {
    const blob = await Server.downloadInvoicePDF(invoiceId)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${invoiceId}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Invoice downloaded')
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to download invoice'
  }
}

async function resendInvoice(invoiceId) {
  try {
    await Server.resendInvoiceEmail(invoiceId)
    toast.success('Invoice email sent')
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to resend invoice'
  }
}

function openConvertDialog() {
  statusDialogType.value = 'convert'
  statusDialogOpen.value = true
}

function openStartNoticeDialog() {
  statusDialogType.value = 'notice'
  statusDialogOpen.value = true
}

function openSoftLockDialog() {
  statusDialogType.value = 'soft_lock'
  statusDialogOpen.value = true
}

function openHardLockDialog() {
  statusDialogType.value = 'hard_lock'
  statusDialogOpen.value = true
}

function openResumeDialog() {
  statusDialogType.value = 'resume'
  statusDialogOpen.value = true
}

function closeStatusDialog() {
  statusDialogOpen.value = false
  statusDialogType.value = ''
  statusChangeNote.value = ''
}

async function confirmStatusChange() {
  if (!statusChangeNote.value.trim()) return
  changingStatus.value = true
  error.value = ''

  const statusMap = {
    convert: 'invoiced',
    notice: 'notice',
    soft_lock: 'soft_locked',
    hard_lock: 'locked',
    resume: 'paid',
  }

  try {
    await Server.updateSchoolBillingStatus(schoolId.value, {
      status: statusMap[statusDialogType.value],
      pilot: statusDialogType.value === 'convert' ? false : undefined,
      note: statusChangeNote.value.trim(),
    })
    successMsg.value = `Status updated: ${statusDialogAction.value}`
    closeStatusDialog()
    await loadData()
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to update status'
  } finally {
    changingStatus.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.adminBillingPage {
  align-items: flex-start;
  justify-content: flex-start;
  padding-top: 1rem;
  padding-bottom: 3rem;
}

.adminBillingShell {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
}

@media (min-width: 768px) {
  .adminBillingShell {
    padding: 0 1.5rem 3rem;
  }
}

.adminHeader {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.08);
}

.adminEyebrow {
  font-family: var(--font);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(var(--ink-rgb), 0.4);
  margin: 0 0 0.4rem;
}

.adminTitle {
  font-family: var(--font);
  font-weight: 600;
  font-size: clamp(1.75rem, 4vw, 2.4rem);
  line-height: 1.15;
  color: var(--white);
  margin: 0;
}

.adminSubtitle {
  font-family: var(--font);
  font-size: 0.9rem;
  color: rgba(var(--ink-rgb), 0.5);
  margin: 0.5rem 0 0;
  max-width: 36rem;
}

.headerActions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.refreshBtn {
  background: rgba(0, 168, 232, 0.18) !important;
  border: 1px solid rgba(0, 168, 232, 0.32) !important;
  color: var(--white) !important;
  border-radius: 10px !important;
}

.adminAlert {
  margin-bottom: 1rem;
  font-family: var(--font);
}

.loadingWrap {
  display: flex;
  justify-content: center;
  padding: 3rem;
}

.statusPanel,
.invoicesPanel,
.auditPanel {
  padding: 1.25rem;
  margin-bottom: 1rem;
  border-radius: 18px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  background: linear-gradient(160deg, rgba(var(--color-bg-rgb), 0.65) 0%, rgba(var(--color-bg-rgb), 0.4) 100%);
  backdrop-filter: blur(14px);
  box-shadow: 0 6px 28px rgba(var(--shadow-rgb), 0.2), inset 0 1px 0 rgba(var(--ink-rgb), 0.04);
}

.statusHead {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.06);
}

.statusTitle {
  font-family: var(--font);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(var(--ink-rgb), 0.5);
  margin: 0 0 0.5rem;
}

.statusRow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.termLabel {
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.5);
}

.statusDetails {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.statusDetailRow {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: rgba(var(--ink-rgb), 0.03);
  border-radius: 10px;
}

.statusDetailLabel {
  font-family: var(--font);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(var(--ink-rgb), 0.45);
}

.statusDetailValue {
  font-family: var(--font);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--white);
}

.statusActions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.panelHead {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.06);
}

.sectionTitle {
  font-family: var(--font);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--white);
  margin: 0;
}

.tableBadge {
  font-family: var(--font);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  color: rgba(var(--ink-rgb), 0.8);
  background: rgba(var(--ink-rgb), 0.06);
  border: 1px solid rgba(var(--ink-rgb), 0.08);
}

.invoicesTable {
  overflow-x: auto;
}

.invoicesTable table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font);
  font-size: 0.82rem;
}

.invoicesTable th,
.invoicesTable td {
  padding: 0.75rem 0.6rem;
  text-align: left;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.05);
}

.invoicesTable th.num,
.invoicesTable td.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.invoicesTable th {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(var(--ink-rgb), 0.4);
}

.invoiceRow {
  transition: background 0.15s;
}

.invoiceRow:hover {
  background: rgba(var(--ink-rgb), 0.03);
}

.invoiceCode {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  color: rgba(var(--ink-rgb), 0.7);
}

.amountCell {
  font-weight: 600;
  color: var(--white);
}

.invoiceStatus {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.invoiceStatus--paid {
  color: rgba(26, 147, 111, 0.95);
  background: rgba(26, 147, 111, 0.08);
}

.invoiceStatus--unpaid {
  color: rgba(247, 183, 7, 0.95);
  background: rgba(247, 183, 7, 0.08);
}

.actionsCell {
  white-space: nowrap;
}

.emptyState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2.5rem 1.5rem;
}

.emptyIcon {
  opacity: 0.25;
  margin-bottom: 1rem;
}

.emptyTitle {
  font-family: var(--font);
  font-weight: 600;
  font-size: 1rem;
  color: rgba(var(--ink-rgb), 0.8);
  margin: 0 0 0.5rem;
}

.emptyText {
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.5);
  margin: 0;
  max-width: 360px;
}

.auditLog {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.auditEntry {
  padding: 0.85rem;
  background: rgba(var(--ink-rgb), 0.03);
  border-radius: 10px;
  border: 1px solid rgba(var(--ink-rgb), 0.06);
}

.auditEntryHead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.4rem;
}

.auditAction {
  font-family: var(--font);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--white);
}

.auditTime {
  font-family: var(--font);
  font-size: 0.7rem;
  color: rgba(var(--ink-rgb), 0.4);
}

.auditNote {
  font-family: var(--font);
  font-size: 0.82rem;
  color: rgba(var(--ink-rgb), 0.65);
  margin: 0 0 0.3rem;
  line-height: 1.4;
}

.auditUser {
  font-family: var(--font);
  font-size: 0.72rem;
  color: rgba(var(--ink-rgb), 0.45);
  margin: 0;
}

.actionDialog {
  font-family: var(--font);
}

.dialogTitle {
  font-weight: 600;
  font-size: 1.15rem;
}

.dialogText {
  font-size: 0.9rem;
  line-height: 1.5;
}

.dialogDesc {
  margin: 0 0 1rem;
  color: rgba(var(--ink-rgb), 0.7);
}

.dialogFields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.dialogSummary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(var(--ink-rgb), 0.04);
  border-radius: 8px;
  font-size: 0.95rem;
}

.dialogSummary strong {
  font-size: 1.1rem;
  color: var(--white);
}

.dialogActions {
  padding: 0 1rem 1rem;
}
</style>
