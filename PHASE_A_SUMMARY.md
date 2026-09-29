# Phase A Implementation Summary

**Branch:** `Phase_A` (pushed)  
**PR:** [#14](https://github.com/Max-Thunderbolt/apple-on-the-desk/pull/14) (draft, into `dev`)  
**Status:** UI complete, ready for API integration

---

## What Was Built

### ✅ Complete UI Implementation

1. **Platform Admin Billing** (`/AdminSchoolBilling?schoolId=...`)
   - Full billing management per school
   - Invoice generation, mark paid, lock ladder controls
   - Audit log requirement for all status changes
   - Pilot school protection

2. **School Admin Billing** (`/SchoolAdminBilling?schoolId=...`)
   - Billing status dashboard
   - Invoice view with EFT payment details
   - Onboarding pack acceptance (3-step dialog)
   - School data export request

3. **Teacher Lock UX**
   - Notice: Amber dismissible banner (per-session)
   - Soft lock: Orange banner + once-daily modal, writes blocked
   - Hard lock: Full-screen gate, no classroom access
   - "Data is safe" copy throughout

4. **Components & Utilities**
   - `BillingStatusChip` — status pills (6 states + pilot)
   - `BillingNoticeBanner` — teacher warning banner
   - `BillingSoftLockModal` — once-daily soft lock modal
   - `BillingHardLockGate` — full-screen hard lock gate
   - `useBillingStatus` — billing cache composable
   - `useBillingLockCheck` — teacher lock integration helper

5. **Navigation Updates**
   - School Admin: Billing tab added
   - Platform Admin: "Manage billing" button per school
   - Status chips visible in school list

---

## What Needs API Implementation

The parallel `apple-on-the-desk-api` implementation on `Phase_A` branch should provide:

### Critical Endpoints

```
GET    /schools/:schoolId/billing                 — billing status object
GET    /schools/:schoolId/invoices                — invoice array
POST   /admin/schools/:schoolId/invoices          — generate invoice
POST   /admin/invoices/:invoiceId/mark-paid       — mark paid (platform only)
GET    /invoices/:invoiceId/pdf                   — PDF blob
PUT    /admin/schools/:schoolId/billing-status    — update status (lock ladder)
```

### Nice-to-Have

```
POST   /admin/invoices/:invoiceId/resend          — resend invoice email
POST   /schools/:schoolId/onboarding-pack         — accept pack
GET    /schools/:schoolId/onboarding-pack         — pack status
POST   /schools/:schoolId/export                  — request export
GET    /schools/:schoolId/export                  — export status
GET    /exports/:exportId/download                — export ZIP blob
```

See `PHASE_A_IMPLEMENTATION.md` for complete API contract with JSON schemas.

---

## What You Need to Check

### 1. Local Checkout

```bash
git fetch origin
git checkout Phase_A
npm install  # if any new deps were added
npm run dev
```

### 2. Manual Testing Scenarios

Without API connected, you can verify UI structure:

#### Platform Admin
- Navigate to `/AdminSchools`
- Select a school
- Click "Manage billing" button
- Verify `/AdminSchoolBilling` page loads
- Check UI structure:
  - Status panel with action buttons
  - Invoice history table (empty state OK)
  - Audit log section
- Open "Generate invoice" dialog
  - Enter term, year, learner count, rate
  - Verify total calculation
- Open "Mark paid" dialog
  - Check audit note field is required

#### School Admin
- Navigate to a school admin route with `?schoolId=...`
- Click "Billing" tab in nav
- Verify `/SchoolAdminBilling` page loads
- Check sections:
  - Status card
  - Invoice section (empty state: "No invoice yet — platform generates")
  - EFT details (conditionally shown)
  - Onboarding pack section
  - Export section
- Open onboarding dialog
  - Check 3 steps render
  - Try accept without all checks — should be disabled
  - Fill all checks + name — accept button enables

#### Teacher Lock Simulation (Manual Mock)

To test lock UI without API:

**Option A: Mock in component**
```js
// In any teacher view component, temporarily add:
const billingStatus = ref({
  status: 'soft_locked',  // or 'locked'
  schoolName: 'Test School',
})
```

**Option B: Mock in server.js**
```js
async getSchoolBillingStatus(schoolId) {
  if (import.meta.env.DEV) {
    return {
      status: 'soft_locked',  // Change to test different states
      schoolName: 'Dev School',
      pilot: false,
    }
  }
  // ... real API call
}
```

Then test:
- **Notice state:** Amber banner appears at top of teacher views
- **Soft lock:** Orange banner + modal on first action (24h cooldown), write buttons show disabled or error
- **Hard lock:** Full-screen gate blocks classroom UI entirely

### 3. Integration Points

When API is ready:

1. **Test full flow:**
   - Platform admin generates invoice
   - School admin sees invoice + EFT details
   - Platform admin marks paid
   - School admin sees "Up to date" status

2. **Test lock ladder:**
   - Platform admin: start notice → soft lock → hard lock → resume
   - Each step requires audit note
   - Verify UI updates after each status change

3. **Test teacher experience:**
   - Set school to `notice` → banner appears
   - Set school to `soft_locked` → banner + modal, writes blocked
   - Set school to `locked` → gate blocks UI

4. **Test onboarding pack:**
   - School admin accepts pack
   - Platform admin sees acceptance status in billing view

5. **Test export:**
   - School admin requests export
   - Check "preparing" state
   - Backend completes job → "ready" state
   - Download triggers ZIP download

---

## Files You Should Review

### New Pages (Main UI)
- `src/pages/SchoolAdminBilling.vue`
- `src/pages/AdminSchoolBilling.vue`

### New Components (Reusable)
- `src/components/common/BillingStatusChip.vue`
- `src/components/common/BillingNoticeBanner.vue`
- `src/components/common/BillingSoftLockModal.vue`
- `src/components/common/BillingHardLockGate.vue`

### Utilities
- `src/composables/useBillingStatus.js`
- `src/composables/useBillingLockCheck.js`

### Modified
- `src/services/server.js` — 12 new API methods
- `src/pages/AdminSchools.vue` — status chips + billing button
- `src/components/admin/SchoolAdminNav.vue` — billing tab

### Documentation
- `PHASE_A_IMPLEMENTATION.md` — complete technical spec
- `TEACHER_LOCK_INTEGRATION_GUIDE.md` — how to wire lock checks into existing teacher views

---

## Next Steps After Review

1. **API Integration**
   - Backend team implements endpoints per `PHASE_A_IMPLEMENTATION.md`
   - Test full flow with real data

2. **Teacher View Wiring**
   - Integrate `useBillingLockCheck` into existing class/shop/points components
   - See `TEACHER_LOCK_INTEGRATION_GUIDE.md` for patterns

3. **Optional Enhancements**
   - A7: PayFast pay link (add `payLink` field to invoice)
   - A8: Tax invoice VAT fields (add VAT fields to PDF template)

4. **Polish**
   - Add Stef logo to hard lock gate (`logoSrc` prop)
   - Finalize EFT bank details (currently placeholder in `SchoolAdminBilling.vue`)
   - Test email templates when backend implements

5. **Deploy**
   - Merge `Phase_A` → `dev`
   - Test on staging
   - Deploy to production

---

## Quick Reference

### Branch Management
```bash
# Switch to Phase_A
git checkout Phase_A

# Pull latest changes
git pull origin Phase_A

# Return to dev
git checkout dev
```

### Dev Server
```bash
# Start frontend dev server
npm run dev

# Usually runs at http://localhost:5173
```

### Testing Status States

Mock different billing states in `server.js` method `getSchoolBillingStatus`:

```js
status: 'trial'        // Blue chip, no restrictions
status: 'invoiced'     // Blue chip, invoice ready
status: 'paid'         // Green chip, up to date
status: 'notice'       // Amber chip, warning banner
status: 'soft_locked'  // Orange chip, banner + modal + writes blocked
status: 'locked'       // Red chip, full-screen gate
pilot: true            // Purple "Pilot" chip override
```

---

## Design Compliance Checklist

Per brief requirements:

- [x] **Billing status model** — 6 states (trial, invoiced, paid, notice, soft_locked, locked) + pilot
- [x] **Soft vs hard lock UX** — banner/modal vs gate, "data is safe" copy
- [x] **Never threaten deletion** — all lock surfaces emphasize data retention
- [x] **Calm professional tone** — no gamification on billing/admin/legal surfaces
- [x] **SLA alignment** — soft before hard, 14-day notice, pilot protection
- [x] **Platform admin actions** — generate invoice, mark paid, lock ladder with audit
- [x] **School admin read-only billing** — view invoice, EFT, no mark-paid
- [x] **Onboarding pack** — SLA, consent wording, privacy defaults
- [x] **Export** — request + download, "your data stays yours"
- [x] **Navigation** — Billing tab (school admin), Billing button (platform admin)

---

## Support

Questions or issues? Check:
- `PHASE_A_IMPLEMENTATION.md` — technical spec
- `TEACHER_LOCK_INTEGRATION_GUIDE.md` — lock integration patterns
- PR [#14](https://github.com/Max-Thunderbolt/apple-on-the-desk/pull/14) — code review

Or contact the implementing agent team.

---

**Phase A UI implementation complete.** Ready for API integration and manual review on `Phase_A` branch.
