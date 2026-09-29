# Route Alignment Changes — Phase A

Updated frontend routes to match the actual API implementation on `Phase_A` branch of `apple-on-the-desk-api`.

## Before / After Route Comparison

### ✅ Billing Routes

| Before (Incorrect) | After (Correct) | Change |
|-------------------|-----------------|--------|
| `GET /schools/:schoolId/billing` | `GET /schools/:schoolId/billing` | ✅ Same (but now returns combined response) |
| `GET /schools/:schoolId/invoices` | ❌ **Removed** | Invoices now included in billing GET response |
| `POST /admin/schools/:schoolId/invoices` | `POST /admin/schools/:schoolId/invoices` | ✅ Same |
| `POST /admin/invoices/:invoiceId/mark-paid` | `POST /admin/schools/:schoolId/invoices/:invoiceNo/mark-paid` | 🔧 Changed params: schoolId + invoiceNo |
| `GET /invoices/:invoiceId/pdf` | `GET /schools/:schoolId/invoices/:invoiceNo/pdf` | 🔧 Changed params: schoolId + invoiceNo |
| `POST /admin/invoices/:invoiceId/resend` | `POST /admin/schools/:schoolId/invoices/:invoiceNo/send-email` | 🔧 Changed params + path: send-email |
| `PUT /admin/schools/:schoolId/billing-status` | ❌ **Removed** | Replaced with dedicated actions below |
| ❌ Missing | `POST /admin/schools/:schoolId/billing/notice` | ✅ **Added** start notice |
| ❌ Missing | `POST /admin/schools/:schoolId/billing/soft-lock` | ✅ **Added** apply soft lock |
| ❌ Missing | `POST /admin/schools/:schoolId/billing/hard-lock` | ✅ **Added** apply hard lock |
| ❌ Missing | `POST /admin/schools/:schoolId/billing/pilot` | ✅ **Added** set pilot status |

### ✅ Onboarding Routes

| Before (Incorrect) | After (Correct) | Change |
|-------------------|-----------------|--------|
| `GET /schools/:schoolId/onboarding-pack` | `GET /schools/:schoolId/onboarding` | 🔧 Changed path: /onboarding |
| `POST /schools/:schoolId/onboarding-pack` | `POST /schools/:schoolId/onboarding/accept` | 🔧 Changed path: /onboarding/accept |
| ❌ Missing | `PUT /schools/:schoolId/onboarding/privacy-defaults` | ✅ **Added** update privacy defaults |
| ❌ Missing | `GET /onboarding/documents` | ✅ **Added** get documents |

### ✅ Export Routes

| Before (Incorrect) | After (Correct) | Change |
|-------------------|-----------------|--------|
| `POST /schools/:schoolId/export` | `POST /schools/:schoolId/export` | ✅ Same |
| `GET /schools/:schoolId/export` | `GET /schools/:schoolId/export/:jobId` | 🔧 Changed: added jobId param |
| `GET /exports/:exportId/download` | `GET /schools/:schoolId/export/:jobId/download` | 🔧 Changed params: schoolId + jobId |
| ❌ Missing | `GET /schools/:schoolId/exports` | ✅ **Added** list all exports |

---

## Server.js Method Signature Changes

### Billing

**Before:**
```js
async markInvoicePaid(invoiceId, data)
async downloadInvoicePDF(invoiceId)
async resendInvoiceEmail(invoiceId)
async updateSchoolBillingStatus(schoolId, data)
```

**After:**
```js
async markInvoicePaid(schoolId, invoiceNo, data)
async downloadInvoicePDF(schoolId, invoiceNo)
async resendInvoiceEmail(schoolId, invoiceNo)
async startBillingNotice(schoolId)
async applySoftLock(schoolId)
async applyHardLock(schoolId)
async setPilotStatus(schoolId, pilot)
```

### Onboarding

**Before:**
```js
async acceptOnboardingPack(schoolId, data)
async getOnboardingPackStatus(schoolId)
```

**After:**
```js
async acceptOnboarding(schoolId, data)
async getOnboardingStatus(schoolId)
async updatePrivacyDefaults(schoolId, data)
async getOnboardingDocuments()
```

### Export

**Before:**
```js
async getSchoolExportStatus(schoolId)
async downloadSchoolExport(exportId)
```

**After:**
```js
async getSchoolExportStatus(schoolId, jobId)
async downloadSchoolExport(schoolId, jobId)
async listSchoolExports(schoolId)
```

---

## Key Changes Summary

### 1. Combined Billing Response
The `GET /schools/:schoolId/billing` endpoint now returns:
```json
{
  "success": true,
  "school": { "id": "...", "name": "..." },
  "billing": { "status": "...", ... },
  "invoices": [ {...}, {...} ]
}
```
Instead of separate calls for billing status and invoices.

### 2. Invoice Identification
- Invoices are identified by `invoiceNumber` (string like "AOTD-2026-0123")
- Not a separate `id` field
- All invoice operations require `schoolId` + `invoiceNumber`

### 3. Dedicated Status Actions
Instead of a generic `PUT /billing-status` endpoint, the API provides:
- `POST /billing/notice` — start 14-day payment notice
- `POST /billing/soft-lock` — apply soft lock
- `POST /billing/hard-lock` — apply hard lock
- `POST /billing/pilot` — set pilot status

**Resume access** is done by marking the invoice as paid (which updates status to `paid`).

### 4. Export Job Tracking
- Exports are identified by `jobId` (string like "exp_def456")
- The billing response includes `latestExportJobId` for convenience
- All export operations require `schoolId` + `jobId`

### 5. Onboarding Path
- Simplified to `/onboarding` (not `/onboarding-pack`)
- Separate endpoints for accept, privacy defaults, and documents

---

## Updated Call Sites

### SchoolAdminBilling.vue
- ✅ Updated `loadBillingData()` to use combined billing response
- ✅ Changed `downloadInvoice()` to pass schoolId + invoiceNo
- ✅ Changed `acceptPack()` to use `acceptOnboarding()`
- ✅ Changed `downloadExport()` to pass schoolId + jobId
- ✅ Updated invoice history loop to use `invoiceNumber` as key

### AdminSchoolBilling.vue
- ✅ Updated `loadData()` to use combined billing response
- ✅ Changed `downloadInvoice()` to pass schoolId + invoiceNo
- ✅ Changed `resendInvoice()` to pass schoolId + invoiceNo
- ✅ Changed `confirmMarkPaid()` to pass schoolId + invoiceNo
- ✅ Updated `confirmStatusChange()` to use dedicated action endpoints
- ✅ Updated invoice table to use `invoiceNumber` as key and identifier

---

## Testing Notes

After API integration, verify:

1. **Billing page loads** — combined response populates status, invoices, and school info
2. **Invoice PDF download** — uses schoolId + invoiceNo parameters
3. **Mark paid** — updates invoice and billing status
4. **Status changes** — notice/soft-lock/hard-lock use dedicated endpoints
5. **Pilot conversion** — uses `/billing/pilot` endpoint
6. **Onboarding** — accept and status use `/onboarding` path
7. **Export** — job tracking uses jobId consistently

---

**Route alignment complete.** Frontend now matches API source of truth on `Phase_A` branch.
