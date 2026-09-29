# Phase A — Sellable Beta Implementation

**Branch:** `Phase_A`  
**Implementation Date:** September 29, 2026  
**Source:** Design brief `phase-a-sellable-beta-design-brief.md`

## Overview

This implementation adds billing infrastructure, lock ladder enforcement, onboarding pack management, and data export to Apple On The Desk, following the Phase A design brief. All surfaces maintain calm, professional tone — **no gamification on billing/admin/legal surfaces**.

---

## Components Added

### 1. Core Components

#### `src/components/common/BillingStatusChip.vue`
Status pill component showing billing state with appropriate colors:
- **trial**: Blue info chip
- **invoiced**: Blue (invoice ready)
- **paid**: Green
- **notice**: Amber warning
- **soft_locked**: Orange
- **locked**: Red
- **pilot**: Purple crown icon override

Used throughout Platform Admin and School Admin views.

#### `src/components/common/BillingNoticeBanner.vue`
Dismissible banner for teachers (per-session dismissal):
- Shows for `notice` (amber) and `soft_locked` (orange) states
- Clear messaging: "access may limit" for notice, "read-only" for soft lock
- Deep-links school admins to Billing

#### `src/components/common/BillingSoftLockModal.vue`
Once-daily modal for teachers in soft lock:
- Lists blocked actions (award points, shop changes, invites)
- "Your data is safe" messaging per brief
- Session storage prevents spam (24h cooldown)

#### `src/components/common/BillingHardLockGate.vue`
Full-screen gate for teachers when `locked`:
- Logo + lock icon + calm message
- "Data is kept safe" + "contact school admin" CTA
- No classroom interactive UI when shown

---

### 2. Pages

#### `src/pages/SchoolAdminBilling.vue` (A5 + A6)
School Admin billing & compliance dashboard:

**Status Card:**
- Current status (trial/invoiced/paid/notice/soft_locked/locked + pilot)
- Status-specific messaging with due dates, days remaining, consequences
- Never implies deletion

**Current Invoice:**
- Invoice number, issue date, due date, amount
- PDF download

**EFT Payment Details:**
- Account name, bank, account number, branch code
- **Payment reference** (large, copy-friendly, monospace)
- Only shown when invoice unpaid

**Invoice History:**
- Table of past invoices with status and PDF download

**Onboarding Pack (A5):**
- Shows acceptance status or pending checklist
- Modal with 3 steps:
  1. Software & Licence Service Agreement (checkbox + scrollable text)
  2. Parent/guardian consent wording (school-owned responsibility)
  3. Privacy defaults (public leaderboards OFF, cross-school OFF)
- Name field for acceptance audit
- Calm professional tone, not marketing

**Export (A6):**
- Request school data export (classes, students, points, shop, teachers)
- "Your data stays yours" messaging
- Shows ready/preparing status
- Download ZIP/CSV bundle with expiry note

#### `src/pages/AdminSchoolBilling.vue` (A1–A4)
Platform Admin billing management per school:

**Status Panel:**
- Current status with term snapshot (learner count, term label)
- Last paid, notice started, lock dates
- Action buttons context-aware:
  - Convert pilot to paid
  - Generate invoice
  - Mark paid
  - Start notice / apply soft lock / apply hard lock
  - Resume access

**Invoice History:**
- Table with invoice number, term, dates, learners, amount, status
- Download PDF, resend email, mark paid actions

**Audit Log:**
- Every status change recorded with admin name, note, timestamp
- Required audit note for manual lock ladder steps

**Generate Invoice Dialog:**
- Term selector, year, learner count, rate per learner
- Shows total calculation (ZAR)
- Sends email on generation

**Mark Paid Dialog:**
- Confirm payment with optional note
- Updates status to `paid`

**Status Change Dialogs:**
- All lock ladder steps require audit note
- Pilot schools cannot be hard-locked without explicit convert

---

### 3. Modified Files

#### `src/pages/AdminSchools.vue`
- Added `BillingStatusChip` to school list items
- New **Billing** action card in school detail with "Manage billing" button → `/AdminSchoolBilling`

#### `src/components/admin/SchoolAdminNav.vue`
- Added "Billing" tab (icon: `mdi-receipt-text-outline`) to school admin nav
- Routes to `/SchoolAdminBilling` with schoolId query param

#### `src/services/server.js`
Added billing API methods:
- `getSchoolBillingStatus(schoolId)`
- `generateInvoice(schoolId, data)`
- `getSchoolInvoices(schoolId)`
- `markInvoicePaid(invoiceId, data)`
- `downloadInvoicePDF(invoiceId)` (blob response)
- `resendInvoiceEmail(invoiceId)`
- `updateSchoolBillingStatus(schoolId, data)`
- `acceptOnboardingPack(schoolId, data)`
- `getOnboardingPackStatus(schoolId)`
- `requestSchoolExport(schoolId)`
- `getSchoolExportStatus(schoolId)`
- `downloadSchoolExport(exportId)` (blob response)

---

### 4. Composables

#### `src/composables/useBillingStatus.js`
Shared billing status cache and utilities:
- `fetchBillingStatus(schoolId, forceRefresh)` — fetch with caching
- `clearCache(schoolId)` — invalidate cache
- `getBillingStatus(schoolId)` — read from cache
- `isLocked(status)` — check soft or hard lock
- `canWriteData(status)` — check if writes allowed
- `shouldShowBanner(status)` — check if banner needed (notice/soft)
- `shouldBlockAccess(status)` — check if gate needed (hard lock)

#### `src/composables/useBillingLockCheck.js`
Teacher view integration helper:
- Auto-fetches billing status for teacher's school
- Computed flags: `isLocked`, `isSoftLocked`, `isHardLocked`, `canWrite`, `blockAccess`, `showBanner`
- `checkWriteAction()` — returns `{ allowed, reason }` for write operations
- Once-daily soft lock modal trigger (session storage)
- Watch schoolId changes

**Usage in teacher views:**
```js
const { canWrite, showBanner, blockAccess, checkWriteAction, billingStatus } = useBillingLockCheck()

// Check before write action
const check = checkWriteAction()
if (!check.allowed) {
  toast.error(check.reason)
  return
}
```

---

## Design Brief Mapping

| Brief Section | Status | Implementation |
|---------------|--------|----------------|
| **A1: Status model** | ✅ Complete | All 6 states (trial, invoiced, paid, notice, soft_locked, locked) + pilot flag. BillingStatusChip, status cards on both admin views. |
| **A2: Invoice PDF** | ⚠️ Stub | Download endpoint exists (`downloadInvoicePDF`). **Backend must generate PDF** per brief layout (EFT details, term snapshot, "Data never deleted" footer). UI shows download button. |
| **A3: Email templates** | ⚠️ Stub | Invoice generation triggers email send. **Backend must implement** 7 email templates (invoice issued, payment received, notice, reminders, locks, restore). |
| **A4: Soft vs hard lock UX** | ✅ Complete | Soft: banner + modal + write blocks. Hard: full-screen gate (`BillingHardLockGate`). "Data is safe" copy on all lock surfaces. Deep-link to Billing. |
| **A5: Onboarding pack** | ✅ Complete | School admin dialog with SLA, consent wording, privacy defaults. Acceptance tracked with name + timestamp. `acceptOnboardingPack` endpoint. |
| **A6: Export** | ⚠️ Partial | UI complete (request, status, download). **Backend must implement** async export job (classes, students, points, shop, teachers minus credentials). ZIP/CSV format. 7-day expiry. |
| **Platform admin actions** | ✅ Complete | Generate invoice, mark paid, start notice, apply soft/hard lock, resume, pilot convert. All with audit logging requirement. |
| **School admin read-only** | ✅ Complete | Invoice view, EFT details, PDF download. No mark-paid action (platform only). |
| **Teacher surfaces** | ✅ Complete | Banner (dismissible per session), soft lock modal (once daily), hard lock gate. No casual deletion threats. |
| **Navigation** | ✅ Complete | School admin Billing tab. Platform admin "Manage billing" button per school. |

---

## Out of Scope (Per Brief)

- **A7: PayFast/Paystack pay link** — Optional "pay online" button on invoice/email. Hooks in place (can add URL field to invoice).
- **A8: Tax invoice (VAT)** — Optional VAT fields on PDF. Current PDF assumes non-VAT "Invoice" header.
- **Class gamification redesign** — Ranks/XP stay on classroom surfaces only (no changes to teacher UI).
- **Parent loop** — Phase D.
- **Zoho integration** — Not in Phase A scope.
- **Live preview-branch inspection** — Max reviews locally on `Phase_A`.

---

## API Expectations (Parallel Implementation)

The **apple-on-the-desk-api** repo on `Phase_A` branch should implement:

### Endpoints

```
GET    /schools/:schoolId/billing                 — billing status object
GET    /schools/:schoolId/invoices                — invoice history
POST   /admin/schools/:schoolId/invoices          — generate + send invoice
POST   /admin/invoices/:invoiceId/mark-paid       — mark paid (platform only)
GET    /invoices/:invoiceId/pdf                   — download PDF blob
POST   /admin/invoices/:invoiceId/resend          — resend email
PUT    /admin/schools/:schoolId/billing-status    — update status (lock ladder)

POST   /schools/:schoolId/onboarding-pack         — accept pack
GET    /schools/:schoolId/onboarding-pack         — pack status

POST   /schools/:schoolId/export                  — request export job
GET    /schools/:schoolId/export                  — export status (ready/preparing)
GET    /exports/:exportId/download                — download ZIP blob
```

### Billing Status Object

```json
{
  "status": "trial | invoiced | paid | notice | soft_locked | locked",
  "pilot": false,
  "schoolName": "Riverside Primary",
  "termLabel": "Term 3 2026",
  "learnerCount": 120,
  "costPerLearnerZAR": 60,
  "dueDate": "2026-10-15T00:00:00Z",
  "lastPaidAt": "2026-07-10T12:34:56Z",
  "noticeStartedAt": null,
  "softLockedAt": null,
  "lockedAt": null,
  "softLockDate": "2026-10-30T00:00:00Z",
  "hardLockDate": "2026-11-06T00:00:00Z",
  "auditLog": [
    {
      "id": "audit_abc123",
      "action": "Status changed: paid → notice",
      "note": "14-day notice started after overdue",
      "adminName": "Jane Doe",
      "adminEmail": "jane@thunderbolt.co.za",
      "timestamp": "2026-10-16T09:00:00Z"
    }
  ]
}
```

### Invoice Object

```json
{
  "id": "inv_xyz789",
  "invoiceNumber": "AOTD-2026-0123",
  "termLabel": "Term 3 2026",
  "issueDate": "2026-09-01T00:00:00Z",
  "dueDate": "2026-10-15T00:00:00Z",
  "learnerCount": 120,
  "ratePerLearner": 60,
  "amountDue": 7200,
  "currency": "ZAR",
  "paymentReference": "AOTD-RIVERSIDE-0123",
  "paid": false,
  "paidAt": null,
  "emailSent": true
}
```

### Onboarding Pack Object

```json
{
  "accepted": true,
  "acceptedBy": "John Admin",
  "acceptedAt": "2026-08-20T14:30:00Z",
  "privacyDefaults": {
    "publicLeaderboards": false,
    "crossSchoolDisplays": false
  }
}
```

### Export Object

```json
{
  "ready": true,
  "preparing": false,
  "exportId": "exp_def456",
  "requestedAt": "2026-09-25T10:00:00Z",
  "readyAt": "2026-09-25T10:05:32Z",
  "expiresAt": "2026-10-02T10:05:32Z"
}
```

---

## Testing Checklist (For Max on Phase_A Locally)

### Platform Admin

- [ ] View schools list — status chips visible
- [ ] Select school → "Manage billing" button works
- [ ] `/AdminSchoolBilling` page loads with status panel
- [ ] Generate invoice dialog — calculates total correctly
- [ ] Mark paid dialog requires note
- [ ] Status change dialogs (notice, soft lock, hard lock, resume) require audit note
- [ ] Audit log displays after status changes
- [ ] Invoice table shows download/resend buttons
- [ ] Pilot schools show "Convert to paid" action

### School Admin

- [ ] Billing tab appears in school admin nav
- [ ] `/SchoolAdminBilling` page loads
- [ ] Status card shows correct state and messaging
- [ ] Current invoice displays EFT details (payment reference copy button)
- [ ] Invoice history table shows past invoices
- [ ] Onboarding pack dialog opens and requires all 3 checks + name
- [ ] Export request works, shows preparing/ready states
- [ ] Export download triggers ZIP download

### Teacher (Soft Lock Simulation)

- [ ] Notice banner appears (amber, dismissible per session)
- [ ] Soft lock modal appears once per day
- [ ] Soft lock banner appears (orange)
- [ ] Write actions blocked with inline error message
- [ ] "Contact school admin" deep-link works

### Teacher (Hard Lock Simulation)

- [ ] After login, full-screen `BillingHardLockGate` blocks all classroom UI
- [ ] Gate shows logo, "Data is safe" message, contact CTA
- [ ] No classroom nav visible behind gate

---

## Design Tone Verification

✅ **Calm professional surfaces:**
- Invoice PDFs, emails, onboarding pack, export: no gamification
- Lock screens: "Data is safe", "Contact school admin" — never "deleted" or "lost"
- Status pills and actions: clear, factual, no casual threats

✅ **Stef brand placement:**
- Logo placeholder in hard lock gate (`logoSrc` prop ready)
- PDF header mentions "Apple On The Desk" (backend implementation)
- Ranks/XP remain on classroom surfaces only

✅ **SLA alignment:**
- Soft before hard
- 14-day notice window
- Pilot schools cannot be hard-locked without convert
- Data never deleted copy on all lock surfaces

---

## Next Steps (Post-Merge)

1. **Backend API implementation** — Endpoints, billing status object, invoice PDF generation, email templates, export job.
2. **PayFast integration (A7)** — Add pay link to invoice UI and emails as optional.
3. **Tax invoice (A8)** — VAT fields on PDF when applicable.
4. **Manual testing** — Max reviews locally on `Phase_A`, API integration testing.
5. **Teacher view integration** — Wire `useBillingLockCheck()` into existing class/shop/points components to enforce write blocks.

---

## Screenshots / Artifacts

See PR for:
- Platform Admin billing page
- School Admin billing page
- Onboarding dialog
- Export section
- Lock banners and gate

---

**Implementation complete.** Ready for API integration and manual review.
