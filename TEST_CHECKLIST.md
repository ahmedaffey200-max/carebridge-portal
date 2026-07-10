# Carebridge Portal — Complete Test Checklist

## Login & Authentication
- [ ] Open portal → Login screen appears
- [ ] Enter PIN: 1234 → Dashboard loads
- [ ] Invalid PIN → Error message shows
- [ ] Session persists on page reload

---

## 1. DASHBOARD (Overview)
- [ ] Load dashboard → 3 metric cards visible (Patients, Travel, Financial)
- [ ] Workflow stepper shows 10 stages (Consultation → Completed)
- [ ] Stage counts reflect actual patient data
- [ ] Click workflow tile → Navigate to journey section
- [ ] Recent activity card shows latest updates
- [ ] Metrics update when patient data changes

---

## 2. PATIENTS (Patient Management)
- [ ] Patient list loads with all records
- [ ] Add patient button works
  - [ ] Fill form with required fields (name, age, gender, destination, country, passport)
  - [ ] Red asterisks show on required fields
  - [ ] Duplicate warning appears if name + age match existing patient
  - [ ] Submit → Patient added to list
  - [ ] Auto-save draft works (reload page → draft recovers)
- [ ] Click patient row → Detail page opens
  - [ ] All patient fields visible
  - [ ] Edit button works → Modal opens, changes save
  - [ ] Delete button works → Confirm dialog, patient removed
- [ ] Search/filter patients by name
- [ ] Sort patients alphabetically

---

## 3. TREATMENT JOURNEY (Patient Stages)
- [ ] Journey board shows all patients with stage cards
- [ ] Drag-reorder patients or click to expand
- [ ] Click patient card → Stage timeline shows
  - [ ] All 10 stages visible with dates/notes
  - [ ] Advance to next stage button works
  - [ ] Add stage note → Saves with timestamp
- [ ] Stage counts on dashboard match journey board

---

## 4. REPORT REVIEW (Medical Documents)
- [ ] Report list shows all documents
- [ ] Click document → Detail view opens
  - [ ] Status dropdown editable (Processing → Approved/Rejected)
  - [ ] Visa status with history visible
  - [ ] Document upload/preview works
- [ ] Filter by status (Pending/Approved/Rejected)
- [ ] Add new document → Modal works

---

## 5. TRAVEL COORDINATION
- [ ] Travel dashboard loads with tabs: Pipeline, Coordination, Logistics, Financial, Payments, Review
- [ ] Pipeline tab:
  - [ ] Shows patients awaiting travel
  - [ ] Click to add travel details
- [ ] Coordination tab:
  - [ ] Visa status, flight, hotel fields editable
  - [ ] Date pickers work
  - [ ] Changes save immediately
- [ ] Logistics tab:
  - [ ] Ground transport, accommodation options visible
  - [ ] Add/edit logistics entries
- [ ] Financial tab:
  - [ ] Travel charges table shows
  - [ ] Add new charge → Modal works
  - [ ] Amounts calculated correctly
- [ ] Payments tab:
  - [ ] Payment records visible
  - [ ] Add payment → Saves with date/amount/method
- [ ] Review tab:
  - [ ] Timeline shows all travel milestones
  - [ ] Status progression visible

---

## 6. COMMUNICATION HUB (Messages)
- [ ] Message list shows all conversations
- [ ] Click patient → Chat opens
  - [ ] Message history visible (admin ↔ patient)
  - [ ] Type message → Sends and saves
  - [ ] New messages appear in real-time
- [ ] Unread count updates

---

## 7. HOSPITAL NETWORK (Hospitals)
- [ ] Hospital list shows all partners
- [ ] Click hospital → Profile page opens
  - [ ] Hospital details visible (name, address, contact, country)
  - [ ] Departments/Specialists list shows
  - [ ] Services table visible
- [ ] Add hospital button works
  - [ ] Form fields (name, address, country, contact) editable
  - [ ] Country dropdown searchable
  - [ ] Submit → Hospital added
- [ ] Edit hospital → Changes save
- [ ] Activate/Deactivate toggle works
- [ ] Partnership status (Active Partner/One-Time) shows with icon

---

## 8. HOSPITAL COMMISSIONS (Commissions)
- [ ] Commission roster loads
- [ ] Table shows: Hospital, Service, Commission Rate, Notes
- [ ] Click row → Edit modal opens
  - [ ] Commission rate editable
  - [ ] Service dropdown works
  - [ ] Save → Updates persist
- [ ] Add commission button works
- [ ] Filter by hospital/service

---

## 9. FINANCIAL (Patient Billing)
- [ ] Patient billing records table loads
- [ ] Click patient → Detail expands
  - [ ] Package info visible (total, paid, unpaid)
  - [ ] Service records table shows (Date, Service, Amount, Status)
- [ ] Add service button works
  - [ ] Date, service type, amount fields editable
  - [ ] Submit → Saved to patient record
- [ ] Edit service → Changes save
- [ ] Delete service → Confirm dialog, removed from record

---

## 10. FINANCE (Dashboard & Analytics)
- [ ] Finance dashboard loads with 7 metrics:
  - [ ] Total Revenue (USD)
  - [ ] Pending Invoices (USD)
  - [ ] Received Payments (USD)
  - [ ] Outstanding Balance (USD)
  - [ ] Average Treatment Cost (USD)
  - [ ] Commission Obligations (USD)
  - [ ] Monthly Growth (%)
- [ ] All metrics calculate correctly from real data
- [ ] No placeholder/random numbers
- [ ] Metrics update when invoices/payments change

---

## 11. COMPANY EXPENSES (Expenses)
- [ ] Expense dashboard loads with breakdown
  - [ ] Total expenses (USD)
  - [ ] Category breakdown visible
  - [ ] Expense trend chart shows
- [ ] Expense table shows all records
- [ ] Add expense button works
  - [ ] Date, category, amount, method, currency fields
  - [ ] Submit → Saved with timestamp
- [ ] Edit expense → Changes persist
- [ ] Delete expense → Confirm, removed
- [ ] Filter by category, date range, method
- [ ] Export button works (CSV or similar)

---

## 12. ANALYTICS (Reports & Insights)
- [ ] Analytics dashboard loads
- [ ] Key metrics visible:
  - [ ] Total patients, cases in progress, completed
  - [ ] Revenue trends chart
  - [ ] Patient distribution by stage
  - [ ] Top hospitals, specialists
- [ ] Charts responsive and readable
- [ ] Date range filters work
- [ ] Export reports functionality

---

## RESPONSIVE TESTING (All sections)
- [ ] **Desktop (1920px):** All elements visible, no overlap
- [ ] **Tablet (768px):** Layout stacks gracefully, no horizontal scroll
- [ ] **Mobile (375px):** Single column, touch targets ≥44px, readable text

---

## DATA PERSISTENCE & AUTO-SAVE
- [ ] Add patient → Reload page → Data persists
- [ ] Edit field → Wait 10s → Reload → Changes saved (draft)
- [ ] Delete patient → Confirm → Data removed immediately
- [ ] All changes reflected in related sections (dashboard, journey, finance)

---

## ERROR HANDLING
- [ ] Invalid form submission → Error messages appear on required fields
- [ ] Duplicate patient name + age → Warning shown
- [ ] Missing required fields → Submit disabled (or error on attempt)
- [ ] Network error (if backend) → Graceful error message

---

## SUMMARY
**Total Tests:** 80+
**Expected Result:** All sections functional, data consistent, responsive across devices, no console errors

Run through this checklist and report any failures. Portal is ready for deployment once all tests pass.
