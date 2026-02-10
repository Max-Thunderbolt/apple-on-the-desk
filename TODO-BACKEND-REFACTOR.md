# Backend Refactoring TODO

This document outlines business logic that currently exists in the frontend and should be moved to the backend for security, consistency, and maintainability.

## Status Legend
- ✅ **DONE** - Already refactored
- 🔴 **CRITICAL** - Security/data integrity issues
- 🟡 **IMPORTANT** - Should be moved for best practices
- 🟢 **OPTIONAL** - Could stay in frontend but better in backend

---

## 1. Points Awarding System

### ✅ DONE: PointsController.awardPoints()
**Location:** `UI/apple-on-the-desk/src/controllers/PointsController.js`
**Status:** Already refactored to use backend endpoint `/classes/:id/award-points`

---

## 2. 🔴 CRITICAL: Shopping/Checkout System

### Problem: classList.vue - `checkout()` function
**Location:** `UI/apple-on-the-desk/src/components/classList.vue:233-287`

**Current Frontend Logic:**
```javascript
- Calculates total cost from shopCost prop
- Sorts students by points (ascending)
- Distributes cost deduction across multiple students
- Validates combined student points
- Directly updates student points via updateClass
```

**Security Issues:**
- Frontend can manipulate the cost calculation
- No server-side validation of purchase legitimacy
- Students could theoretically be given items without proper point deduction
- Race conditions if multiple purchases happen simultaneously

**Action Required:**
1. Create new backend endpoint: `POST /classes/:id/purchase`
2. Request body: `{ studentIds: [], shopItemIds: [] }`
3. Backend should:
   - Fetch actual shop item costs from database (don't trust frontend)
   - Validate students exist and have sufficient combined points
   - Calculate and apply deductions using same distribution logic
   - Update students atomically in single transaction
   - Return updated students and transaction summary
4. Update `classList.vue` to call this new endpoint
5. Remove all cost calculation and point deduction logic from frontend

**Files to Modify:**
- **Backend:**
  - `API/controllers/classController.js` - Add `purchaseItems()` function
  - `API/routes/index.js` - Add route `router.post('/classes/:id/purchase', classController.purchaseItems)`
- **Frontend:**
  - `UI/apple-on-the-desk/src/services/server.js` - Add `purchaseItems(classId, studentIds, shopItemIds)` method
  - `UI/apple-on-the-desk/src/components/classList.vue` - Replace `checkout()` logic with server call

---

## 3. 🔴 CRITICAL: Duplicate Award Points Logic (Needs Cleanup)

### Problem: Class [id].vue - `awardPoints()` function
**Location:** `UI/apple-on-the-desk/src/pages/Class/[id].vue:101-135`

**Current State:**
- This function still exists but is UNUSED (the modal now uses the new backend endpoint)
- Contains OLD business logic: `const increment = baseValue / 10`
- Directly manipulates student points
- Should be REMOVED entirely

**Action Required:**
1. **DELETE** the entire `awardPoints()` function from `Class/[id].vue`
2. Verify no code is calling this function
3. Remove `pointsCategories` and `pointsCategoriesLoading` refs if unused

**Files to Modify:**
- `UI/apple-on-the-desk/src/pages/Class/[id].vue` - Remove unused function

---

## 4. 🔴 CRITICAL: Duplicate Award Points Logic (Needs Replacement)

### Problem: classList.vue - `awardPoints()` function  
**Location:** `UI/apple-on-the-desk/src/components/classList.vue:211-231`

**Current Frontend Logic:**
```javascript
- Awards points: (s.points ?? 0) + value
- Calculates experience: (value * 2) + props.experience
- Directly updates via Server.updateClass()
```

**Issue:**
- This is DUPLICATE logic - we already have backend endpoint `/classes/:id/award-points`
- Uses different calculation than the main award points flow (no whole class logic)
- Directly calls updateClass instead of awardPoints endpoint

**Action Required:**
1. **REPLACE** this function to use `PointsController.awardPoints()` or directly call the backend endpoint
2. Remove the experience calculation (backend handles it)
3. Ensure it passes correct parameters to match the new endpoint

**Files to Modify:**
- `UI/apple-on-the-desk/src/components/classList.vue` - Update `awardPoints()` to use backend endpoint

---

## 5. 🟡 IMPORTANT: Student Name Editing

### Problem: classList.vue - `editStudentName()` function
**Location:** `UI/apple-on-the-desk/src/components/classList.vue:181-209`

**Current Frontend Logic:**
```javascript
- Maps over all students
- Updates specific student's name
- Calls Server.updateClass() with entire student array
```

**Issues:**
- Frontend sends entire students array just to update one name
- No validation of name uniqueness or constraints
- Could be more efficient with dedicated endpoint

**Action Required (Optional but Recommended):**
1. Create backend endpoint: `PUT /classes/:id/students/:studentId`
2. Request body: `{ name: string }`
3. Backend validates name (no duplicates, length constraints, etc.)
4. Update only that student in the database
5. Update frontend to call new endpoint

**Alternative (Simpler):**
- Keep current approach but add validation in `updateClass` endpoint

**Files to Modify:**
- **Backend:**
  - `API/controllers/classController.js` - Add `updateStudent()` function (optional)
  - `API/routes/index.js` - Add route (optional)
- **Frontend:**
  - `UI/apple-on-the-desk/src/services/server.js` - Add `updateStudent()` method (optional)
  - `UI/apple-on-the-desk/src/components/classList.vue` - Update to use new endpoint (optional)

---

## 6. 🟢 OPTIONAL: Experience Rank Calculation

### Current State: ExperienceController.js - `experienceToRank()` function
**Location:** `UI/apple-on-the-desk/src/controllers/ExperienceController.js:21-41`

**Current Frontend Logic:**
```javascript
- Contains rank thresholds (0-100 = Beginner, 100-200 = Novice, etc.)
- Maps experience to rank icon and name
```

**Consideration:**
- This is **presentational logic** and could stay in frontend
- However, if ranks are used for unlocking features or rewards, should be in backend
- If only for display purposes, frontend is fine

**Action Required:**
- **Option A (Recommended):** Keep in frontend if purely UI/display
- **Option B:** Move to backend if ranks affect game mechanics or permissions

**Decision Needed:** Does rank affect any backend logic? (unlocks, permissions, etc.)

---

## 7. ✅ DONE: Create Points Category

### Current State: PointsController - `createPointsCategory()` and `deletePointsCategory()`
**Location:** `UI/apple-on-the-desk/src/controllers/PointsController.js:24-32`

**Status:** These call `Server.createPointsCategory()` and `Server.deletePointsCategory()`

**Action Required:**
1. Verify these backend endpoints exist and work correctly
2. If they don't exist, create them:
   - `POST /points-categories` - Create category
   - `DELETE /points-categories/:id` - Delete category

**Files to Check:**
- `API/routes/index.js` - Verify routes exist
- `API/controllers/pointsCategoryController.js` - Verify functions exist

---

## Summary of Actions

### Immediate (Critical Security Issues)
1. ✅ Award points system - ALREADY DONE
2. 🔴 Create purchase/checkout endpoint
3. 🔴 Remove duplicate `awardPoints()` from `Class/[id].vue`
4. 🔴 Replace `awardPoints()` in `classList.vue` to use backend

### Short Term (Best Practices)
5. 🟡 Consider dedicated student update endpoint
6. 🟡 Verify/create points category CRUD endpoints

### Long Term (Optional)
7. 🟢 Evaluate if experience ranks should be backend logic

---

## Testing Checklist

After refactoring, test:
- [ ] Award points to single student
- [ ] Award points to whole class  
- [ ] Purchase shop items with single student
- [ ] Purchase shop items with multiple students
- [ ] Purchase fails when insufficient points
- [ ] Edit student name
- [ ] Create points category
- [ ] Delete points category
- [ ] Experience updates correctly
- [ ] Rank displays correctly based on experience

---

## Notes

- All backend changes should include proper error handling
- Add validation for all user inputs
- Use database transactions for operations that modify multiple records
- Consider rate limiting for purchase endpoints
- Add logging for audit trail of point changes
