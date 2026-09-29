<template>
  <div class="container billingPage">
    <div class="billingShell">
      <SchoolAdminNav />

      <header class="billingHeader">
        <div class="billingHeaderLeft">
          <p class="billingEyebrow">School administration</p>
          <h1 class="billingTitle">
            Billing &amp; <span class="titleAccent">compliance</span>
          </h1>
          <p class="billingSubtitle">
            Current billing status, invoices, payment details, onboarding pack, and data export.
          </p>
        </div>
        <v-btn class="refreshBtn" size="small" :loading="loading" icon="mdi-refresh" variant="flat"
          @click="loadBillingData" />
      </header>

      <v-alert v-if="error" type="error" variant="tonal" class="billingAlert" rounded="lg" closable
        @click:close="error = ''">
        {{ error }}
      </v-alert>

      <v-alert v-if="successMsg" type="success" variant="tonal" class="billingAlert" rounded="lg" closable
        @click:close="successMsg = ''">
        {{ successMsg }}
      </v-alert>

      <div v-if="loading && !billingStatus" class="loadingWrap">
        <v-progress-circular indeterminate color="primary" size="48" width="4" />
      </div>

      <template v-if="billingStatus">
        <!-- Status card -->
        <section class="statusCard">
          <div class="statusHeader">
            <div>
              <h2 class="statusTitle">Billing status</h2>
              <p class="statusSchool">{{ schoolName }}</p>
            </div>
            <BillingStatusChip :status="billingStatus.status" :pilot="billingStatus.pilot" />
          </div>

          <div v-if="billingStatus.status === 'trial' || billingStatus.pilot" class="statusBody statusBody--trial">
            <v-icon size="32" color="rgba(168,51,185,0.7)">mdi-flask-outline</v-icon>
            <div>
              <p class="statusMessage">
                <strong>Pilot school — not billed yet.</strong>
              </p>
              <p class="statusDetail">
                You are part of our pilot program. Billing will begin when your school formally converts to paid.
              </p>
            </div>
          </div>

          <div v-else-if="billingStatus.status === 'invoiced'" class="statusBody statusBody--invoiced">
            <v-icon size="32" color="rgba(0,120,232,0.8)">mdi-file-document</v-icon>
            <div>
              <p class="statusMessage">
                <strong>Invoice ready — please pay by {{ formatDate(billingStatus.dueDate) }}</strong>
              </p>
              <p class="statusDetail">
                Payment keeps your school's access active. See payment details below.
              </p>
            </div>
          </div>

          <div v-else-if="billingStatus.status === 'paid'" class="statusBody statusBody--paid">
            <v-icon size="32" color="rgba(26,147,111,0.9)">mdi-check-circle</v-icon>
            <div>
              <p class="statusMessage">
                <strong>Up to date for {{ billingStatus.termLabel }}</strong>
              </p>
              <p class="statusDetail">
                Last payment received {{ formatDate(billingStatus.lastPaidAt) }}.
              </p>
            </div>
          </div>

          <div v-else-if="billingStatus.status === 'notice'" class="statusBody statusBody--notice">
            <v-icon size="32" color="rgba(247,183,7,0.9)">mdi-alert</v-icon>
            <div>
              <p class="statusMessage">
                <strong>Payment notice — {{ daysRemaining }} days remaining</strong>
              </p>
              <p class="statusDetail">
                After {{ formatDate(billingStatus.softLockDate) }}, teachers will have read-only access. 
                After {{ formatDate(billingStatus.hardLockDate) }}, classroom access will be paused. 
                <strong>Your data is safe and never deleted.</strong>
              </p>
            </div>
          </div>

          <div v-else-if="billingStatus.status === 'soft_locked'" class="statusBody statusBody--softLock">
            <v-icon size="32" color="rgba(237,108,2,0.95)">mdi-lock-open-variant</v-icon>
            <div>
              <p class="statusMessage">
                <strong>Soft lock active</strong>
              </p>
              <p class="statusDetail">
                Teachers can view classes but cannot award points or make changes. 
                Pay the invoice below to restore full access. 
                <strong>Your school's data is kept safe.</strong>
              </p>
            </div>
          </div>

          <div v-else-if="billingStatus.status === 'locked'" class="statusBody statusBody--hardLock">
            <v-icon size="32" color="rgba(197,40,61,0.95)">mdi-lock</v-icon>
            <div>
              <p class="statusMessage">
                <strong>Hard lock active</strong>
              </p>
              <p class="statusDetail">
                Classroom access is paused. You can still access billing, onboarding, and data export. 
                Pay the invoice to restore access. 
                <strong>Your school's data is kept safe and will never be deleted.</strong>
              </p>
            </div>
          </div>
        </section>

        <!-- Current invoice -->
        <section v-if="currentInvoice" class="invoiceCard">
          <div class="cardHeader">
            <div class="cardHeaderIcon">
              <v-icon size="22" color="var(--white)">mdi-receipt-text-outline</v-icon>
            </div>
            <div>
              <h3 class="cardTitle">Current invoice</h3>
              <p class="cardDesc">{{ currentInvoice.termLabel }} — {{ currentInvoice.learnerCount }} learners</p>
            </div>
          </div>

          <div class="invoiceDetails">
            <div class="invoiceRow">
              <span class="invoiceLabel">Invoice number</span>
              <code class="invoiceValue">{{ currentInvoice.invoiceNumber }}</code>
            </div>
            <div class="invoiceRow">
              <span class="invoiceLabel">Issue date</span>
              <span class="invoiceValue">{{ formatDate(currentInvoice.issueDate) }}</span>
            </div>
            <div class="invoiceRow">
              <span class="invoiceLabel">Due date</span>
              <span class="invoiceValue invoiceValue--due">{{ formatDate(currentInvoice.dueDate) }}</span>
            </div>
            <div class="invoiceRow invoiceRow--total">
              <span class="invoiceLabel"><strong>Amount due</strong></span>
              <span class="invoiceValue invoiceValue--amount"><strong>{{ formatZAR(currentInvoice.amountDue) }}</strong></span>
            </div>
          </div>

          <div class="invoiceActions">
            <v-btn variant="outlined" prepend-icon="mdi-download" class="invoiceBtn" @click="downloadInvoice(currentInvoice.invoiceNumber)">
              Download PDF
            </v-btn>
          </div>
        </section>

        <!-- Payment details -->
        <section v-if="currentInvoice && billingStatus.status !== 'paid'" class="paymentCard">
          <div class="cardHeader">
            <div class="cardHeaderIcon cardHeaderIcon--payment">
              <v-icon size="22" color="var(--white)">mdi-bank-transfer</v-icon>
            </div>
            <div>
              <h3 class="cardTitle">EFT payment details</h3>
              <p class="cardDesc">Use these details to pay via electronic funds transfer</p>
            </div>
          </div>

          <div class="paymentDetails">
            <div class="paymentRow">
              <span class="paymentLabel">Account name</span>
              <span class="paymentValue">{{ eftDetails.accountName }}</span>
            </div>
            <div class="paymentRow">
              <span class="paymentLabel">Bank</span>
              <span class="paymentValue">{{ eftDetails.bank }}</span>
            </div>
            <div class="paymentRow">
              <span class="paymentLabel">Account number</span>
              <code class="paymentValue paymentValue--code">{{ eftDetails.accountNumber }}</code>
            </div>
            <div class="paymentRow">
              <span class="paymentLabel">Branch code</span>
              <code class="paymentValue paymentValue--code">{{ eftDetails.branchCode }}</code>
            </div>
            <div class="paymentRow paymentRow--reference">
              <span class="paymentLabel"><strong>Payment reference</strong></span>
              <div class="referenceBlock">
                <code class="referenceCode">{{ currentInvoice.paymentReference }}</code>
                <v-btn size="x-small" icon="mdi-content-copy" variant="text" 
                  @click="copyReference(currentInvoice.paymentReference)" />
              </div>
            </div>
          </div>
        </section>

        <!-- Invoice history -->
        <section v-if="invoiceHistory.length > 1" class="historyCard">
          <div class="cardHeader">
            <div class="cardHeaderIcon">
              <v-icon size="22" color="var(--white)">mdi-history</v-icon>
            </div>
            <h3 class="cardTitle">Invoice history</h3>
          </div>

          <div class="historyTable">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Term</th>
                  <th>Issue date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="inv in invoiceHistory.slice(1)" :key="inv.invoiceNumber" class="historyRow">
                  <td><code class="historyCode">{{ inv.invoiceNumber }}</code></td>
                  <td>{{ inv.termLabel }}</td>
                  <td>{{ formatDate(inv.issueDate) }}</td>
                  <td class="historyAmount">{{ formatZAR(inv.amountDue) }}</td>
                  <td>
                    <span class="historyStatus" :class="inv.paid ? 'historyStatus--paid' : 'historyStatus--unpaid'">
                      {{ inv.paid ? 'Paid' : 'Unpaid' }}
                    </span>
                  </td>
                  <td>
                    <v-btn size="x-small" variant="text" icon="mdi-download" 
                      @click="downloadInvoice(inv.invoiceNumber)" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- No invoice yet -->
        <section v-if="!currentInvoice && !invoiceHistory.length" class="emptyCard">
          <v-icon size="48" class="emptyIcon">mdi-receipt-text-outline</v-icon>
          <p class="emptyTitle">No invoice yet</p>
          <p class="emptyText">
            Platform administrators generate invoices at the start of each term. You will be notified by email when your first invoice is ready.
          </p>
        </section>

        <!-- Onboarding pack -->
        <section class="onboardingCard">
          <div class="cardHeader">
            <div class="cardHeaderIcon cardHeaderIcon--onboarding">
              <v-icon size="22" color="var(--white)">mdi-clipboard-check-outline</v-icon>
            </div>
            <div>
              <h3 class="cardTitle">Onboarding pack</h3>
              <p class="cardDesc">Service agreement, consent wording, and privacy defaults</p>
            </div>
          </div>

          <div v-if="onboardingPack.accepted" class="onboardingAccepted">
            <v-icon size="24" color="rgba(26,147,111,0.9)">mdi-check-circle</v-icon>
            <div>
              <p class="onboardingMessage"><strong>Onboarding pack accepted</strong></p>
              <p class="onboardingDetail">
                Accepted by {{ onboardingPack.acceptedBy }} on {{ formatDate(onboardingPack.acceptedAt) }}
              </p>
            </div>
          </div>

          <div v-else class="onboardingPending">
            <div class="onboardingChecklist">
              <div class="checklistItem">
                <v-icon size="18">mdi-circle-outline</v-icon>
                <span>Software & Licence Service Agreement</span>
              </div>
              <div class="checklistItem">
                <v-icon size="18">mdi-circle-outline</v-icon>
                <span>Parent/guardian consent wording</span>
              </div>
              <div class="checklistItem">
                <v-icon size="18">mdi-circle-outline</v-icon>
                <span>Privacy defaults configuration</span>
              </div>
            </div>
            <v-btn variant="outlined" prepend-icon="mdi-file-document" class="onboardingBtn" @click="openOnboardingDialog">
              Review &amp; accept pack
            </v-btn>
          </div>
        </section>

        <!-- Export -->
        <section class="exportCard">
          <div class="cardHeader">
            <div class="cardHeaderIcon cardHeaderIcon--export">
              <v-icon size="22" color="var(--white)">mdi-database-export-outline</v-icon>
            </div>
            <div>
              <h3 class="cardTitle">Export school data</h3>
              <p class="cardDesc">Download all classes, students, points, and settings</p>
            </div>
          </div>

          <div class="exportBody">
            <p class="exportText">
              Your school data stays yours. Request a complete export to download classes, students, points history, 
              shop configuration, and teachers (excluding credentials).
            </p>
            <p v-if="exportStatus.ready" class="exportReady">
              <v-icon size="18" color="rgba(26,147,111,0.9)">mdi-check-circle</v-icon>
              Export ready — requested {{ formatDate(exportStatus.requestedAt) }}
            </p>
            <div class="exportActions">
              <v-btn v-if="exportStatus.ready" variant="outlined" prepend-icon="mdi-download" class="exportBtn"
                @click="downloadExport">
                Download export
              </v-btn>
              <v-btn v-else-if="exportStatus.preparing" variant="outlined" prepend-icon="mdi-loading" class="exportBtn" disabled>
                Preparing export…
              </v-btn>
              <v-btn v-else variant="outlined" prepend-icon="mdi-database-export" class="exportBtn" 
                :loading="requestingExport" @click="requestExport">
                Request export
              </v-btn>
            </div>
            <p v-if="exportStatus.ready" class="exportExpiry">
              Export expires {{ formatDate(exportStatus.expiresAt) }}
            </p>
          </div>
        </section>
      </template>

      <!-- Onboarding dialog -->
      <v-dialog v-model="onboardingDialogOpen" max-width="720" persistent>
        <v-card class="onboardingDialog">
          <v-card-title class="onboardingDialogTitle">Onboarding pack</v-card-title>
          <v-card-text class="onboardingDialogText">
            <div class="onboardingStep">
              <h4 class="onboardingStepTitle">1. Software & Licence Service Agreement</h4>
              <div class="onboardingScrollBox">
                <p>
                  <strong>Apple On The Desk Software & Licence Service Agreement</strong>
                </p>
                <p>
                  By using Apple On The Desk ("the Service"), your school agrees to:
                </p>
                <ul>
                  <li>Pay invoiced amounts by the stated due date</li>
                  <li>Provide accurate learner counts for billing</li>
                  <li>Comply with data protection regulations (POPIA)</li>
                  <li>Handle parent/guardian consent as required by law</li>
                </ul>
                <p>
                  <strong>Service level commitment:</strong> Your school's data is never deleted for non-payment. 
                  Access may be limited after notice period if invoices remain unpaid, but data remains safe and accessible 
                  when payment resumes.
                </p>
              </div>
              <v-checkbox v-model="onboardingChecks.agreement" label="I am authorised to accept on behalf of the school"
                density="compact" hide-details class="onboardingCheck" />
            </div>

            <div class="onboardingStep">
              <h4 class="onboardingStepTitle">2. Parent/guardian consent wording</h4>
              <div class="onboardingScrollBox">
                <p>
                  <strong>School-owned responsibility</strong>
                </p>
                <p>
                  The following consent wording is provided for your school to use with parents/guardians. 
                  Your school is responsible for obtaining consent under POPIA.
                </p>
                <div class="consentWording">
                  <p>
                    "Our school uses Apple On The Desk, a classroom management tool that helps teachers award points, 
                    track progress, and motivate learners. Learner names and classroom data are stored securely. 
                    For questions, contact your school administration."
                  </p>
                </div>
              </div>
              <v-checkbox v-model="onboardingChecks.consent" 
                label="We will handle parent/guardian consent under POPIA"
                density="compact" hide-details class="onboardingCheck" />
            </div>

            <div class="onboardingStep">
              <h4 class="onboardingStepTitle">3. Privacy defaults</h4>
              <p class="onboardingStepDesc">
                These settings protect learner privacy and can be changed later under school settings.
              </p>
              <div class="privacyDefaults">
                <div class="privacyDefault">
                  <v-icon size="20" color="rgba(26,147,111,0.9)">mdi-check</v-icon>
                  <span>Public leaderboards: <strong>OFF by default</strong></span>
                </div>
                <div class="privacyDefault">
                  <v-icon size="20" color="rgba(26,147,111,0.9)">mdi-check</v-icon>
                  <span>Cross-school displays: <strong>OFF by default</strong></span>
                </div>
              </div>
              <v-checkbox v-model="onboardingChecks.privacy" label="I understand these privacy defaults"
                density="compact" hide-details class="onboardingCheck" />
            </div>

            <v-text-field v-model="acceptorName" label="Your name (for records)" density="compact" variant="outlined"
              class="glassField acceptorField" hide-details />
          </v-card-text>
          <v-card-actions class="onboardingDialogActions">
            <v-spacer />
            <v-btn variant="text" :disabled="acceptingPack" @click="closeOnboardingDialog">Cancel</v-btn>
            <v-btn color="primary" :loading="acceptingPack" :disabled="!canAcceptPack" @click="acceptPack">
              Accept pack
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
import { useUserProfile } from '@/composables/useUserProfile'
import SchoolAdminNav from '@/components/admin/SchoolAdminNav.vue'
import BillingStatusChip from '@/components/common/BillingStatusChip.vue'

const route = useRoute()
const router = useRouter()
const { schoolAdminSchools } = useUserProfile()

const schoolId = computed(() => {
  // Try query param first, then fall back to first school admin school
  const querySchoolId = route.query.schoolId
  if (querySchoolId) return querySchoolId
  
  if (schoolAdminSchools.value.length > 0) {
    return schoolAdminSchools.value[0].schoolId
  }
  
  return null
})

const loading = ref(false)
const error = ref('')
const successMsg = ref('')
const billingStatus = ref(null)
const invoiceHistory = ref([])
const onboardingPack = ref({ accepted: false })
const exportStatus = ref({ ready: false, preparing: false })
const requestingExport = ref(false)
const schoolName = ref('')

const onboardingDialogOpen = ref(false)
const onboardingChecks = ref({ agreement: false, consent: false, privacy: false })
const acceptorName = ref('')
const acceptingPack = ref(false)

const eftDetails = {
  accountName: 'Thunderbolt Consulting (Pty) Ltd',
  bank: 'Standard Bank',
  accountNumber: '123456789',
  branchCode: '051001',
}

const currentInvoice = computed(() => {
  if (!invoiceHistory.value.length) return null
  return invoiceHistory.value[0]
})

const daysRemaining = computed(() => {
  if (!billingStatus.value?.softLockDate) return 0
  const now = new Date()
  const lockDate = new Date(billingStatus.value.softLockDate)
  const diff = lockDate - now
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

const canAcceptPack = computed(() => {
  return onboardingChecks.value.agreement &&
    onboardingChecks.value.consent &&
    onboardingChecks.value.privacy &&
    acceptorName.value.trim().length > 0
})

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatZAR(amount) {
  if (typeof amount !== 'number') return 'R 0'
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount)
}

async function loadBillingData() {
  if (!schoolId.value) {
    if (schoolAdminSchools.value.length === 0) {
      error.value = 'You do not have school admin access. Contact your platform administrator.'
    } else {
      error.value = 'No school selected. Please contact support.'
    }
    return
  }

  // Add schoolId to URL if not already present (for bookmarking/refreshing)
  if (!route.query.schoolId && schoolId.value) {
    router.replace({ query: { schoolId: schoolId.value } })
  }

  error.value = ''
  loading.value = true

  try {
    const [billingData, onboardingData] = await Promise.all([
      Server.getSchoolBillingStatus(schoolId.value),
      Server.getOnboardingStatus(schoolId.value),
    ])

    billingStatus.value = billingData.billing || {}
    schoolName.value = billingData.school?.name || 'School'
    invoiceHistory.value = (billingData.invoices || []).map(toInvoiceView)
    onboardingPack.value = onboardingData

    // If we have a latest export job ID, fetch its status
    if (billingData.billing?.latestExportJobId) {
      try {
        const exportData = await Server.getSchoolExportStatus(
          schoolId.value,
          billingData.billing.latestExportJobId
        )
        exportStatus.value = exportData
      } catch {
        // Export status not critical for page load
        exportStatus.value = { ready: false, preparing: false }
      }
    } else {
      exportStatus.value = { ready: false, preparing: false }
    }
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to load billing data'
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

async function downloadInvoice(invoiceNo) {
  if (!schoolId.value) return
  try {
    const blob = await Server.downloadInvoicePDF(schoolId.value, invoiceNo)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${invoiceNo}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Invoice downloaded')
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to download invoice'
  }
}

async function copyReference(ref) {
  try {
    await navigator.clipboard.writeText(ref)
    toast.success('Payment reference copied')
  } catch {
    error.value = 'Could not copy reference'
  }
}

function openOnboardingDialog() {
  onboardingDialogOpen.value = true
}

function closeOnboardingDialog() {
  onboardingDialogOpen.value = false
  onboardingChecks.value = { agreement: false, consent: false, privacy: false }
  acceptorName.value = ''
}

async function acceptPack() {
  if (!schoolId.value) return
  acceptingPack.value = true
  error.value = ''

  try {
    await Server.acceptOnboarding(schoolId.value, {
      acceptedBy: acceptorName.value.trim(),
    })
    successMsg.value = 'Onboarding pack accepted'
    closeOnboardingDialog()
    await loadBillingData()
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to accept onboarding pack'
  } finally {
    acceptingPack.value = false
  }
}

async function requestExport() {
  if (!schoolId.value) return
  requestingExport.value = true
  error.value = ''

  try {
    await Server.requestSchoolExport(schoolId.value)
    successMsg.value = 'Export requested — preparing your data'
    await loadBillingData()
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to request export'
  } finally {
    requestingExport.value = false
  }
}

async function downloadExport() {
  if (!schoolId.value || !exportStatus.value.jobId) return

  try {
    const blob = await Server.downloadSchoolExport(schoolId.value, exportStatus.value.jobId)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `school-export-${schoolId.value}.zip`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Export downloaded')
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to download export'
  }
}

onMounted(loadBillingData)
</script>

<style scoped>
.billingPage {
  align-items: flex-start;
  justify-content: flex-start;
  padding-top: 1rem;
  padding-bottom: 3rem;
}

.billingShell {
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
}

@media (min-width: 768px) {
  .billingShell {
    padding: 0 1.5rem 3rem;
  }
}

.billingHeader {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.08);
}

.billingEyebrow {
  font-family: var(--font);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(var(--ink-rgb), 0.4);
  margin: 0 0 0.4rem;
}

.billingTitle {
  font-family: var(--font);
  font-weight: 600;
  font-size: clamp(1.75rem, 4vw, 2.4rem);
  line-height: 1.15;
  color: var(--white);
  margin: 0;
}

.billingSubtitle {
  font-family: var(--font);
  font-size: 0.9rem;
  color: rgba(var(--ink-rgb), 0.5);
  margin: 0.5rem 0 0;
  max-width: 36rem;
}

.refreshBtn {
  background: rgba(0, 168, 232, 0.18) !important;
  border: 1px solid rgba(0, 168, 232, 0.32) !important;
  color: var(--white) !important;
  border-radius: 10px !important;
}

.billingAlert {
  margin-bottom: 1rem;
  font-family: var(--font);
}

.loadingWrap {
  display: flex;
  justify-content: center;
  padding: 3rem;
}

.statusCard,
.invoiceCard,
.paymentCard,
.historyCard,
.emptyCard,
.onboardingCard,
.exportCard {
  padding: 1.25rem;
  margin-bottom: 1rem;
  border-radius: 18px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  background: linear-gradient(160deg, rgba(var(--color-bg-rgb), 0.65) 0%, rgba(var(--color-bg-rgb), 0.4) 100%);
  backdrop-filter: blur(14px);
  box-shadow: 0 6px 28px rgba(var(--shadow-rgb), 0.2), inset 0 1px 0 rgba(var(--ink-rgb), 0.04);
}

.statusHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.statusTitle {
  font-family: var(--font);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(var(--ink-rgb), 0.5);
  margin: 0 0 0.25rem;
}

.statusSchool {
  font-family: var(--font);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--white);
  margin: 0;
}

.statusBody {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
}

.statusBody--trial {
  background: rgba(168, 51, 185, 0.06);
  border: 1px solid rgba(168, 51, 185, 0.15);
}

.statusBody--invoiced {
  background: rgba(0, 120, 232, 0.06);
  border: 1px solid rgba(0, 120, 232, 0.15);
}

.statusBody--paid {
  background: rgba(26, 147, 111, 0.06);
  border: 1px solid rgba(26, 147, 111, 0.15);
}

.statusBody--notice {
  background: rgba(247, 183, 7, 0.06);
  border: 1px solid rgba(247, 183, 7, 0.15);
}

.statusBody--softLock {
  background: rgba(237, 108, 2, 0.06);
  border: 1px solid rgba(237, 108, 2, 0.15);
}

.statusBody--hardLock {
  background: rgba(197, 40, 61, 0.06);
  border: 1px solid rgba(197, 40, 61, 0.15);
}

.statusMessage {
  font-family: var(--font);
  font-size: 0.95rem;
  color: var(--white);
  margin: 0 0 0.5rem;
  line-height: 1.4;
}

.statusDetail {
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.6);
  margin: 0;
  line-height: 1.5;
}

.cardHeader {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.06);
}

.cardHeaderIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(0, 168, 232, 0.15);
  flex-shrink: 0;
}

.cardHeaderIcon--payment {
  background: rgba(247, 183, 7, 0.15);
}

.cardHeaderIcon--onboarding {
  background: rgba(26, 147, 111, 0.15);
}

.cardHeaderIcon--export {
  background: rgba(168, 51, 185, 0.15);
}

.cardTitle {
  font-family: var(--font);
  font-size: 1rem;
  font-weight: 600;
  color: var(--white);
  margin: 0;
}

.cardDesc {
  font-family: var(--font);
  font-size: 0.8rem;
  color: rgba(var(--ink-rgb), 0.5);
  margin: 0.25rem 0 0;
}

.invoiceDetails {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.invoiceRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.05);
}

.invoiceRow--total {
  border-top: 1px solid rgba(var(--ink-rgb), 0.1);
  border-bottom: none;
  padding-top: 0.75rem;
  margin-top: 0.25rem;
}

.invoiceLabel {
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.5);
}

.invoiceValue {
  font-family: var(--font);
  font-size: 0.88rem;
  color: var(--white);
  font-variant-numeric: tabular-nums;
}

.invoiceValue--due {
  color: rgba(247, 183, 7, 0.95);
  font-weight: 600;
}

.invoiceValue--amount {
  font-size: 1.1rem;
  color: var(--white);
}

.invoiceActions {
  display: flex;
  gap: 0.5rem;
}

.invoiceBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
}

.paymentDetails {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.paymentRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.05);
}

.paymentRow--reference {
  border-top: 1px solid rgba(var(--ink-rgb), 0.12);
  border-bottom: none;
  padding-top: 0.85rem;
  margin-top: 0.25rem;
}

.paymentLabel {
  font-family: var(--font);
  font-size: 0.82rem;
  color: rgba(var(--ink-rgb), 0.5);
}

.paymentValue {
  font-family: var(--font);
  font-size: 0.88rem;
  color: var(--white);
}

.paymentValue--code {
  font-family: ui-monospace, monospace;
  font-size: 0.82rem;
  color: var(--white);
}

.referenceBlock {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.referenceCode {
  font-family: ui-monospace, monospace;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--white);
  background: rgba(var(--ink-rgb), 0.06);
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  letter-spacing: 0.05em;
}

.historyTable {
  overflow-x: auto;
}

.historyTable table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font);
  font-size: 0.82rem;
}

.historyTable th,
.historyTable td {
  padding: 0.6rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.05);
}

.historyTable th {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(var(--ink-rgb), 0.4);
}

.historyRow {
  transition: background 0.15s;
}

.historyRow:hover {
  background: rgba(var(--ink-rgb), 0.03);
}

.historyCode {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  color: rgba(var(--ink-rgb), 0.7);
}

.historyAmount {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--white);
}

.historyStatus {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.historyStatus--paid {
  color: rgba(26, 147, 111, 0.95);
  background: rgba(26, 147, 111, 0.08);
}

.historyStatus--unpaid {
  color: rgba(197, 40, 61, 0.85);
  background: rgba(197, 40, 61, 0.06);
}

.emptyCard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 240px;
  padding: 2rem 1.5rem;
}

.emptyIcon {
  opacity: 0.25;
  margin-bottom: 1rem;
}

.emptyTitle {
  font-family: var(--font);
  font-weight: 600;
  font-size: 1.05rem;
  color: rgba(var(--ink-rgb), 0.8);
  margin: 0 0 0.5rem;
}

.emptyText {
  font-family: var(--font);
  font-size: 0.88rem;
  color: rgba(var(--ink-rgb), 0.5);
  margin: 0 auto;
  max-width: 420px;
  line-height: 1.5;
}

.onboardingAccepted {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  background: rgba(26, 147, 111, 0.06);
  border: 1px solid rgba(26, 147, 111, 0.15);
}

.onboardingMessage {
  font-family: var(--font);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--white);
  margin: 0 0 0.25rem;
}

.onboardingDetail {
  font-family: var(--font);
  font-size: 0.8rem;
  color: rgba(var(--ink-rgb), 0.55);
  margin: 0;
}

.onboardingPending {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.onboardingChecklist {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(var(--ink-rgb), 0.03);
  border-radius: 10px;
}

.checklistItem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.6);
}

.onboardingBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  align-self: flex-start;
}

.exportBody {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.exportText {
  font-family: var(--font);
  font-size: 0.88rem;
  color: rgba(var(--ink-rgb), 0.6);
  margin: 0;
  line-height: 1.5;
}

.exportReady {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font);
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(26, 147, 111, 0.95);
  margin: 0;
}

.exportActions {
  display: flex;
  gap: 0.5rem;
}

.exportBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
}

.exportExpiry {
  font-family: var(--font);
  font-size: 0.75rem;
  color: rgba(var(--ink-rgb), 0.4);
  margin: 0;
}

.onboardingDialog {
  font-family: var(--font);
}

.onboardingDialogTitle {
  font-weight: 600;
  font-size: 1.2rem;
}

.onboardingDialogText {
  max-height: 65vh;
  overflow-y: auto;
}

.onboardingStep {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.08);
}

.onboardingStep:last-of-type {
  border-bottom: none;
  margin-bottom: 0.5rem;
  padding-bottom: 0;
}

.onboardingStepTitle {
  font-family: var(--font);
  font-size: 1rem;
  font-weight: 600;
  color: var(--white);
  margin: 0 0 0.75rem;
}

.onboardingStepDesc {
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.55);
  margin: 0 0 0.75rem;
  line-height: 1.4;
}

.onboardingScrollBox {
  max-height: 200px;
  overflow-y: auto;
  padding: 0.75rem;
  background: rgba(var(--ink-rgb), 0.03);
  border-radius: 10px;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
  line-height: 1.6;
  color: rgba(var(--ink-rgb), 0.65);
}

.onboardingScrollBox p {
  margin: 0 0 0.75rem;
}

.onboardingScrollBox p:last-child {
  margin: 0;
}

.onboardingScrollBox ul {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
}

.onboardingScrollBox li {
  margin-bottom: 0.35rem;
}

.consentWording {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(var(--ink-rgb), 0.04);
  border-left: 3px solid rgba(0, 168, 232, 0.4);
  border-radius: 8px;
}

.consentWording p {
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.75);
}

.privacyDefaults {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: rgba(26, 147, 111, 0.04);
  border-radius: 10px;
}

.privacyDefault {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.7);
}

.onboardingCheck {
  margin-top: 0;
}

.acceptorField {
  margin-top: 0.75rem;
}

.onboardingDialogActions {
  padding: 0 1rem 1rem;
}
</style>
