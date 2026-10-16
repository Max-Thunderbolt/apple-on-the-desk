<template>
  <div class="container adminBillingPage">
    <div class="adminBillingShell">
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

      <v-alert v-if="billingStatus && !billingStatus.payeeConfigured" type="warning" variant="tonal"
        class="adminAlert" rounded="lg">
        Bank details aren't configured on the API (BILLING_BANK_NAME, BILLING_ACCOUNT_NAME,
        BILLING_ACCOUNT_NO, BILLING_BRANCH_CODE). Invoices can't be generated until they are.
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
                <span v-if="billingStatus.termSnapshot?.termLabel" class="termLabel">
                  {{ billingStatus.termSnapshot.termLabel }}
                </span>
              </div>
            </div>
          </div>

          <div class="statusDetails">
            <div class="statusDetailRow">
              <span class="statusDetailLabel">Billable teachers (current)</span>
              <span class="statusDetailValue">
                {{ billingStatus.currentBillableTeacherCount ?? 0 }}
                <span class="statusDetailHint">of {{ billingStatus.currentTeacherCount ?? 0 }} teachers</span>
              </span>
            </div>
            <div class="statusDetailRow">
              <span class="statusDetailLabel">Next annual invoice</span>
              <span class="statusDetailValue">{{ formatZAR(estimate.total) }}</span>
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
            <div v-if="billingStatus.status === 'notice' && billingStatus.softLockAt" class="statusDetailRow">
              <span class="statusDetailLabel">Soft lock from</span>
              <span class="statusDetailValue">{{ formatDate(billingStatus.softLockAt) }}</span>
            </div>
            <div v-if="billingStatus.softLockedAt" class="statusDetailRow">
              <span class="statusDetailLabel">Soft locked</span>
              <span class="statusDetailValue">{{ formatDate(billingStatus.softLockedAt) }}</span>
            </div>
            <div v-if="billingStatus.lockedAt" class="statusDetailRow">
              <span class="statusDetailLabel">Hard locked</span>
              <span class="statusDetailValue">{{ formatDate(billingStatus.lockedAt) }}</span>
            </div>
            <div v-if="billingStatus.conversion" class="statusDetailRow">
              <span class="statusDetailLabel">Converted from pilot</span>
              <span class="statusDetailValue">
                {{ billingStatus.conversion.agreementRef }} · {{ formatDate(billingStatus.conversion.agreementDate) }}
                · billing from {{ billingStatus.conversion.startYear }}
              </span>
            </div>
          </div>

          <div class="statusActions">
            <v-btn v-if="billingStatus.pilot" variant="outlined" size="small" prepend-icon="mdi-handshake-outline"
              @click="openConvertDialog">
              Convert to paid
            </v-btn>
            <v-btn v-if="canMarkPilot" variant="outlined" size="small" prepend-icon="mdi-flag-outline"
              @click="openStatusDialog('pilot')">
              Mark as pilot
            </v-btn>
            <v-btn v-if="canGenerateInvoice" variant="outlined" size="small"
              prepend-icon="mdi-receipt-text-plus-outline" @click="openGenerateInvoiceDialog">
              Generate invoice
            </v-btn>
            <v-btn v-if="currentUnpaidInvoice" variant="outlined" size="small" color="success"
              prepend-icon="mdi-check-circle-outline" @click="openMarkPaidDialog(currentUnpaidInvoice)">
              Mark paid
            </v-btn>
            <v-btn v-if="billingStatus.status === 'invoiced' && isOverdue" variant="outlined" size="small" color="warning"
              prepend-icon="mdi-alert-circle-outline" @click="openStatusDialog('notice')">
              Start notice
            </v-btn>
            <v-btn v-if="billingStatus.status === 'notice' && !billingStatus.pilot" variant="outlined" size="small"
              color="warning" prepend-icon="mdi-lock-open-variant-outline" @click="openStatusDialog('soft_lock')">
              Apply soft lock
            </v-btn>
            <v-btn v-if="billingStatus.status === 'soft_locked' && !billingStatus.pilot" variant="outlined"
              size="small" color="error" prepend-icon="mdi-lock-outline" @click="openStatusDialog('hard_lock')">
              Apply hard lock
            </v-btn>
          </div>
        </section>

        <!-- Invoice history -->
        <section class="invoicesPanel">
          <div class="panelHead">
            <h2 class="sectionTitle">Invoice history</h2>
            <span class="tableBadge">{{ invoices.length }}</span>
            <v-spacer />
            <v-btn v-if="canGenerateInvoice" size="small" variant="outlined"
              prepend-icon="mdi-receipt-text-plus-outline" @click="openGenerateInvoiceDialog">
              Generate new invoice
            </v-btn>
          </div>

          <div v-if="invoices.length" class="invoicesTable">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Period</th>
                  <th>Issue date</th>
                  <th>Due date</th>
                  <th class="num">Billable teachers</th>
                  <th class="num">Amount</th>
                  <th>Status</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="inv in invoices" :key="inv.invoiceNumber" class="invoiceRow">
                  <td><code class="invoiceCode">{{ inv.invoiceNumber }}</code></td>
                  <td>{{ inv.termLabel }}</td>
                  <td>{{ formatDate(inv.issueDate) }}</td>
                  <td>{{ formatDate(inv.dueDate) }}</td>
                  <td class="num">{{ inv.pricingModel === 'teacher' ? inv.billableTeacherCount : '—' }}</td>
                  <td class="num amountCell">{{ formatZAR(inv.amountDue) }}</td>
                  <td>
                    <span class="invoiceStatus" :class="inv.paid ? 'invoiceStatus--paid' : 'invoiceStatus--unpaid'">
                      {{ inv.paid ? `Paid ${formatDate(inv.paidAt)}` : 'Unpaid' }}
                    </span>
                  </td>
                  <td>{{ inv.emailSent ? `Sent ${formatDate(inv.emailSentAt)}` : 'Not sent' }}</td>
                  <td class="actionsCell">
                    <v-btn size="x-small" variant="text" icon="mdi-download" title="Download PDF"
                      @click="downloadInvoice(inv.invoiceNumber)" />
                    <v-btn v-if="!inv.paid" size="x-small" variant="text"
                      :icon="inv.emailSent ? 'mdi-email-sync-outline' : 'mdi-email-arrow-right-outline'"
                      :title="inv.emailSent ? 'Resend invoice email' : 'Send invoice email'"
                      :loading="sendingEmailFor === inv.invoiceNumber"
                      @click="sendInvoiceEmail(inv)" />
                    <v-btn v-if="!inv.paid" size="x-small" variant="text" icon="mdi-check-circle-outline"
                      title="Mark paid" @click="openMarkPaidDialog(inv)" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="emptyState">
            <v-icon size="48" class="emptyIcon">mdi-receipt-text-outline</v-icon>
            <p class="emptyTitle">No invoices yet</p>
            <p class="emptyText">Generate the first annual invoice for this school to begin billing.</p>
          </div>
        </section>

        <!-- Data export on behalf of the school -->
        <section class="auditPanel">
          <div class="panelHead">
            <h2 class="sectionTitle">School data export</h2>
          </div>
          <div class="exportRow">
            <v-text-field v-model="exportReason" label="Reason (required for an export on behalf of the school)"
              density="compact" variant="outlined" class="glassField" hide-details />
            <v-btn variant="outlined" size="small" prepend-icon="mdi-database-export-outline"
              :disabled="!exportReason.trim()" :loading="requestingExport" @click="requestExport">
              Request export
            </v-btn>
          </div>
          <p v-if="latestExport" class="exportStatus">
            Latest export: {{ exportStatusLabel(latestExport) }}
            <v-btn v-if="latestExport.status === 'ready' && !isExpired(latestExport)" size="x-small" variant="text"
              prepend-icon="mdi-download" @click="downloadExport(latestExport)">
              Download
            </v-btn>
          </p>
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
              <p v-if="entry.adminName || entry.adminEmail" class="auditUser">
                By {{ entry.adminName || entry.adminEmail }}
              </p>
            </div>
          </div>
        </section>
      </template>

      <!-- Generate invoice dialog: amounts come from the server, only the year is an input -->
      <v-dialog v-model="generateDialogOpen" max-width="560" persistent>
        <v-card class="actionDialog">
          <v-card-title class="dialogTitle">Generate annual invoice</v-card-title>
          <v-card-text class="dialogText">
            <p class="dialogDesc">
              Create the annual invoice for {{ school?.name }}. Amounts are calculated by the server from the
              current billable teachers (teachers with at least one class at this school).
            </p>
            <v-alert v-if="yearAlreadyInvoiced" type="warning" variant="tonal" density="compact" class="dialogAlert">
              {{ generateForm.year }} has already been invoiced.
            </v-alert>
            <v-alert v-if="!billingStatus?.smtpConfigured" type="info" variant="tonal" density="compact"
              class="dialogAlert">
              SMTP isn't configured on the API, so the invoice can't be emailed yet. Download the PDF instead.
            </v-alert>
            <div class="dialogFields">
              <v-select v-model="generateForm.year" :items="yearItems" label="Year" density="compact"
                variant="outlined" class="glassField" hide-details />
              <v-checkbox v-model="generateForm.sendEmail" :disabled="!billingStatus?.smtpConfigured"
                label="Email the invoice to the school admins now" density="compact" hide-details />
            </div>
            <div class="dialogSummary">
              <div class="summaryLine">
                <span>
                  {{ estimate.billableTeacherCount }} billable teachers × {{ formatZAR(estimate.perTeacherRate) }}
                  per teacher per year:
                </span>
                <strong>{{ formatZAR(estimate.teacherSubtotal) }}</strong>
              </div>
              <div v-if="estimate.platformFee > 0" class="summaryLine">
                <span>Platform onboarding fee (once-off, more than {{ billingStatus?.platformFeeThreshold }} teachers):</span>
                <strong>{{ formatZAR(estimate.platformFee) }}</strong>
              </div>
              <div class="summaryLine summaryLine--total">
                <span>Total amount:</span>
                <strong>{{ formatZAR(estimate.total) }}</strong>
              </div>
            </div>
          </v-card-text>
          <v-card-actions class="dialogActions">
            <v-spacer />
            <v-btn variant="text" :disabled="generatingInvoice" @click="closeGenerateDialog">Cancel</v-btn>
            <v-btn color="primary" :loading="generatingInvoice"
              :disabled="yearAlreadyInvoiced || !billingStatus?.payeeConfigured || !estimate.billableTeacherCount"
              @click="confirmGenerateInvoice">
              {{ generateForm.sendEmail ? 'Generate & email' : 'Generate' }}
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
              ({{ formatZAR(selectedInvoice?.amountDue) }}, reference
              <code>{{ selectedInvoice?.paymentReference }}</code>).
            </p>
            <div class="dialogFields">
              <v-text-field v-model="markPaidForm.paidDate" label="Date received" type="date" :max="todayISO"
                density="compact" variant="outlined" class="glassField" hide-details />
              <v-text-field v-model="markPaidForm.paymentReferenceReceived" label="Reference on bank statement (optional)"
                density="compact" variant="outlined" class="glassField" hide-details />
              <v-text-field v-model="markPaidForm.note" label="Payment note (optional)" density="compact"
                variant="outlined" class="glassField" hide-details placeholder="e.g. EFT received, confirmed via bank" />
            </div>
          </v-card-text>
          <v-card-actions class="dialogActions">
            <v-spacer />
            <v-btn variant="text" :disabled="markingPaid" @click="closeMarkPaidDialog">Cancel</v-btn>
            <v-btn color="success" :loading="markingPaid" :disabled="!markPaidForm.paidDate" @click="confirmMarkPaid">
              Mark paid
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Convert pilot dialog -->
      <v-dialog v-model="convertDialogOpen" max-width="520" persistent>
        <v-card class="actionDialog">
          <v-card-title class="dialogTitle">Convert pilot to paid</v-card-title>
          <v-card-text class="dialogText">
            <p class="dialogDesc">
              Record the written agreement. The school's admin must have accepted the onboarding pack.
              Invoices can be generated from the start year.
            </p>
            <div class="dialogFields">
              <v-text-field v-model="convertForm.agreementRef" label="Agreement reference" density="compact"
                variant="outlined" class="glassField" hide-details />
              <v-text-field v-model="convertForm.agreementDate" label="Agreement date" type="date" :max="todayISO"
                density="compact" variant="outlined" class="glassField" hide-details />
              <v-select v-model="convertForm.startYear" :items="yearItems" label="Billing starts (year)"
                density="compact" variant="outlined" class="glassField" hide-details />
              <v-textarea v-model="convertForm.note" label="Note (optional)" rows="2" density="compact"
                variant="outlined" class="glassField" hide-details />
            </div>
          </v-card-text>
          <v-card-actions class="dialogActions">
            <v-spacer />
            <v-btn variant="text" :disabled="converting" @click="convertDialogOpen = false">Cancel</v-btn>
            <v-btn color="primary" :loading="converting"
              :disabled="!convertForm.agreementRef.trim() || !convertForm.agreementDate || !convertForm.startYear"
              @click="confirmConvert">
              Convert
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Status change dialogs -->
      <v-dialog v-model="statusDialogOpen" max-width="520" persistent>
        <v-card class="actionDialog">
          <v-card-title class="dialogTitle">{{ statusDialog.title }}</v-card-title>
          <v-card-text class="dialogText">
            <p class="dialogDesc">{{ statusDialog.message }}</p>
            <v-textarea v-model="statusChangeNote" label="Audit note (required)" density="compact" variant="outlined"
              class="glassField" hide-details rows="3" placeholder="Reason for this status change" />
          </v-card-text>
          <v-card-actions class="dialogActions">
            <v-spacer />
            <v-btn variant="text" :disabled="changingStatus" @click="closeStatusDialog">Cancel</v-btn>
            <v-btn :color="statusDialog.color" :loading="changingStatus" :disabled="!statusChangeNote.trim()"
              @click="confirmStatusChange">
              {{ statusDialog.action }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import Server from '@/services/server'
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

const thisYear = new Date().getFullYear()
const yearItems = [thisYear - 1, thisYear, thisYear + 1]
const todayISO = new Date().toISOString().slice(0, 10)

const generateDialogOpen = ref(false)
const generateForm = ref({ year: thisYear, sendEmail: false })
const generatingInvoice = ref(false)

const markPaidDialogOpen = ref(false)
const selectedInvoice = ref(null)
const markPaidForm = ref({ paidDate: todayISO, paymentReferenceReceived: '', note: '' })
const markingPaid = ref(false)

const convertDialogOpen = ref(false)
const convertForm = ref({ agreementRef: '', agreementDate: todayISO, startYear: thisYear, note: '' })
const converting = ref(false)

const statusDialogOpen = ref(false)
const statusDialogType = ref('')
const statusChangeNote = ref('')
const changingStatus = ref(false)

const sendingEmailFor = ref(null)

const exportReason = ref('')
const requestingExport = ref(false)
const latestExport = ref(null)
let exportPollTimer = null

/** Server-computed estimate: the dialog never does its own pricing maths */
const estimate = computed(() => {
  const e = billingStatus.value?.estimatedNextInvoice || {}
  return {
    billableTeacherCount: e.billableTeacherCount ?? billingStatus.value?.currentBillableTeacherCount ?? 0,
    perTeacherRate: e.perTeacherRate ?? billingStatus.value?.perTeacherRate ?? 0,
    teacherSubtotal: e.teacherSubtotal ?? 0,
    platformFee: e.platformFee ?? 0,
    total: e.total ?? e.subtotal ?? 0,
  }
})

const currentUnpaidInvoice = computed(() => invoices.value.find((inv) => !inv.paid) || null)

const isOverdue = computed(() => {
  const due = billingStatus.value?.dueDate || currentUnpaidInvoice.value?.dueDate
  return due ? new Date(due) < new Date() : false
})

const canGenerateInvoice = computed(
  () => billingStatus.value && !billingStatus.value.pilot && ['trial', 'paid'].includes(billingStatus.value.status),
)

const canMarkPilot = computed(
  () => billingStatus.value && !billingStatus.value.pilot && !billingStatus.value.conversion
    && billingStatus.value.status === 'trial',
)

const yearAlreadyInvoiced = computed(
  () => (billingStatus.value?.invoicedYears || []).includes(generateForm.value.year),
)

const STATUS_DIALOGS = {
  pilot: {
    title: 'Mark as pilot',
    message: 'Pilot schools are not invoiced and are never locked. Converting back to paid needs the written agreement.',
    action: 'Mark as pilot',
    color: 'primary',
  },
  notice: {
    title: 'Start payment notice',
    message: 'Start the 14-day payment notice period. School admins are emailed and teachers see a notice banner.',
    action: 'Start notice',
    color: 'warning',
  },
  soft_lock: {
    title: 'Apply soft lock',
    message: 'Teachers can view classes but cannot award points or make changes. School admins keep billing and export.',
    action: 'Apply soft lock',
    color: 'error',
  },
  hard_lock: {
    title: 'Apply hard lock',
    message: "Classroom access is paused for teachers. The school's data is kept; admins keep billing and export.",
    action: 'Apply hard lock',
    color: 'error',
  },
}

const statusDialog = computed(() => STATUS_DIALOGS[statusDialogType.value] || { title: 'Change status', message: '', action: 'Confirm', color: 'primary' })

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
    minute: '2-digit',
  })
}

function formatZAR(amount) {
  if (typeof amount !== 'number') return 'R 0'
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount)
}

function apiError(e, fallback) {
  return e.response?.data?.message || e.message || fallback
}

async function loadData() {
  if (!schoolId.value) {
    error.value = 'No school selected'
    return
  }

  error.value = ''
  loading.value = true

  try {
    const [schoolsData, billingData] = await Promise.all([
      Server.listAdminSchools(),
      Server.getSchoolBillingStatus(schoolId.value),
    ])

    school.value = (schoolsData.schools || []).find(s => s.id === schoolId.value) || billingData.school
    billingStatus.value = billingData.billing || {}
    invoices.value = (billingData.invoices || []).map(toInvoiceView)
    auditLog.value = billingData.billing?.auditLog || []
    await loadExports()
  } catch (e) {
    error.value = apiError(e, 'Failed to load billing data')
  } finally {
    loading.value = false
  }
}

function toInvoiceView(inv) {
  return {
    ...inv,
    invoiceNumber: inv.invoiceNo,
    amountDue: inv.total,
    paid: inv.status === 'paid',
    paymentReference: inv.eftReference,
  }
}

function goBack() {
  router.push('/AdminSchools')
}

function openGenerateInvoiceDialog() {
  const invoiced = billingStatus.value?.invoicedYears || []
  generateForm.value = {
    year: invoiced.includes(thisYear) ? thisYear + 1 : thisYear,
    sendEmail: Boolean(billingStatus.value?.smtpConfigured),
  }
  generateDialogOpen.value = true
}

function closeGenerateDialog() {
  generateDialogOpen.value = false
}

function describeEmailResult(email) {
  if (!email) return ''
  if (email.sent) return ` and emailed to ${email.recipients?.join(', ') || 'the school admins'}`
  return `. Email not sent: ${email.reason}`
}

async function confirmGenerateInvoice() {
  generatingInvoice.value = true
  error.value = ''

  try {
    const result = await Server.generateInvoice(schoolId.value, {
      year: generateForm.value.year,
      sendEmail: generateForm.value.sendEmail,
    })
    const inv = result.invoice
    const msg = `Invoice ${inv.invoiceNo} generated (${formatZAR(inv.total)})${describeEmailResult(result.email)}`
    if (result.email && !result.email.sent) error.value = msg
    else successMsg.value = msg
    closeGenerateDialog()
    await loadData()
  } catch (e) {
    error.value = apiError(e, 'Failed to generate invoice')
  } finally {
    generatingInvoice.value = false
  }
}

async function sendInvoiceEmail(inv) {
  if (!schoolId.value) return
  sendingEmailFor.value = inv.invoiceNumber
  try {
    const result = await Server.resendInvoiceEmail(schoolId.value, inv.invoiceNumber)
    if (result.emailSent) {
      toast.success(`Invoice ${inv.invoiceNumber} emailed to ${result.recipients?.join(', ') || 'the school admins'}`)
    } else {
      toast.error(`Email not sent: ${result.reason || 'unknown reason'}`)
    }
    await loadData()
  } catch (e) {
    error.value = apiError(e, 'Failed to send invoice email')
  } finally {
    sendingEmailFor.value = null
  }
}

function openMarkPaidDialog(invoice) {
  if (!invoice) return
  selectedInvoice.value = invoice
  markPaidForm.value = { paidDate: todayISO, paymentReferenceReceived: '', note: '' }
  markPaidDialogOpen.value = true
}

function closeMarkPaidDialog() {
  markPaidDialogOpen.value = false
  selectedInvoice.value = null
}

async function confirmMarkPaid() {
  if (!selectedInvoice.value || !schoolId.value) return
  markingPaid.value = true
  error.value = ''

  try {
    const result = await Server.markInvoicePaid(schoolId.value, selectedInvoice.value.invoiceNumber, {
      paidDate: markPaidForm.value.paidDate,
      paymentReferenceReceived: markPaidForm.value.paymentReferenceReceived,
      note: markPaidForm.value.note,
    })
    successMsg.value = result.otherInvoicesOutstanding
      ? 'Invoice marked as paid. Another invoice is still outstanding, so the status is unchanged.'
      : `Invoice marked as paid${result.accessRestored ? '; access restored' : ''}`
    closeMarkPaidDialog()
    await loadData()
  } catch (e) {
    error.value = apiError(e, 'Failed to mark invoice paid')
  } finally {
    markingPaid.value = false
  }
}

async function downloadInvoice(invoiceNo) {
  if (!schoolId.value) return
  try {
    const blob = await Server.downloadInvoicePDF(schoolId.value, invoiceNo)
    saveBlob(blob, `AOTD-Invoice-${String(invoiceNo).padStart(5, '0')}.pdf`)
    toast.success('Invoice downloaded')
  } catch (e) {
    error.value = apiError(e, 'Failed to download invoice')
  }
}

function saveBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

function openConvertDialog() {
  convertForm.value = { agreementRef: '', agreementDate: todayISO, startYear: thisYear, note: '' }
  convertDialogOpen.value = true
}

async function confirmConvert() {
  converting.value = true
  error.value = ''
  try {
    await Server.convertPilotToPaid(schoolId.value, { ...convertForm.value })
    successMsg.value = 'Pilot converted to paid'
    convertDialogOpen.value = false
    await loadData()
  } catch (e) {
    error.value = apiError(e, 'Failed to convert pilot')
  } finally {
    converting.value = false
  }
}

function openStatusDialog(type) {
  statusDialogType.value = type
  statusChangeNote.value = ''
  statusDialogOpen.value = true
}

function closeStatusDialog() {
  statusDialogOpen.value = false
  statusDialogType.value = ''
  statusChangeNote.value = ''
}

async function confirmStatusChange() {
  const note = statusChangeNote.value.trim()
  if (!note || !schoolId.value) return
  changingStatus.value = true
  error.value = ''

  try {
    let emailResult = null
    if (statusDialogType.value === 'pilot') {
      await Server.setPilotStatus(schoolId.value, true, note)
    } else if (statusDialogType.value === 'notice') {
      emailResult = await Server.startBillingNotice(schoolId.value, note)
    } else if (statusDialogType.value === 'soft_lock') {
      emailResult = await Server.applySoftLock(schoolId.value, note)
    } else if (statusDialogType.value === 'hard_lock') {
      emailResult = await Server.applyHardLock(schoolId.value, note)
    }
    const emailNote = emailResult && !emailResult.emailSent ? ` (email not sent: ${emailResult.emailReason})` : ''
    successMsg.value = `Status updated: ${statusDialog.value.action}${emailNote}`
    closeStatusDialog()
    await loadData()
  } catch (e) {
    error.value = apiError(e, 'Failed to update status')
  } finally {
    changingStatus.value = false
  }
}

// ── Export on behalf of the school ─────────────────────────
function isExpired(job) {
  return job?.expiresAt && Date.now() > job.expiresAt
}

function exportStatusLabel(job) {
  if (job.status === 'ready') {
    return isExpired(job) ? `expired ${formatDate(job.expiresAt)}` : `ready, available until ${formatDate(job.expiresAt)}`
  }
  if (['pending', 'processing'].includes(job.status)) return 'preparing…'
  return job.status
}

async function loadExports() {
  try {
    const data = await Server.listSchoolExports(schoolId.value)
    latestExport.value = data.jobs?.[0] || null
    clearTimeout(exportPollTimer)
    if (latestExport.value && ['pending', 'processing'].includes(latestExport.value.status)) {
      exportPollTimer = setTimeout(loadExports, 3000)
    }
  } catch {
    latestExport.value = null
  }
}

async function requestExport() {
  requestingExport.value = true
  try {
    await Server.requestSchoolExport(schoolId.value, exportReason.value.trim())
    exportReason.value = ''
    toast.success('Export requested')
    await loadData()
  } catch (e) {
    error.value = apiError(e, 'Failed to request export')
  } finally {
    requestingExport.value = false
  }
}

async function downloadExport(job) {
  try {
    const blob = await Server.downloadSchoolExport(schoolId.value, job.jobId)
    saveBlob(blob, `AOTD-Export-${job.jobId.slice(0, 8)}.zip`)
  } catch (e) {
    error.value = apiError(e, 'Failed to download export')
  }
}

onMounted(loadData)
onUnmounted(() => clearTimeout(exportPollTimer))
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

.dialogAlert {
  margin-bottom: 1rem;
  font-family: var(--font);
}

.dialogFields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.dialogSummary {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(var(--ink-rgb), 0.04);
  border-radius: 8px;
  font-size: 0.88rem;
}

.summaryLine {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summaryLine--total {
  padding-top: 0.5rem;
  margin-top: 0.25rem;
  border-top: 1px solid rgba(var(--ink-rgb), 0.1);
  font-size: 0.95rem;
}

.summaryLine strong {
  font-size: 1.05rem;
  color: var(--white);
  font-variant-numeric: tabular-nums;
}

.summaryLine--total strong {
  font-size: 1.15rem;
}

.dialogActions {
  padding: 0 1rem 1rem;
}

.statusDetailHint {
  margin-left: 0.35rem;
  font-weight: 400;
  color: rgba(var(--ink-rgb), 0.5);
}

.exportRow {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.exportRow .glassField {
  flex: 1 1 280px;
}

.exportStatus {
  margin: 0.75rem 0 0;
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.7);
}
</style>
