# Carebridge Portal — project rules

## GOLDEN RULE: additive-only data protection (CRITICAL)
Every future update must be **additive only**. Never delete, overwrite, reset, rename, or modify any existing manually-entered data — patients, staff, financial records, expenses, payments, invoices, bookings, notes, documents, uploaded files, settings, reports, or any other records.

## NO FABRICATED DATA (CRITICAL)
Never inject random, generic, placeholder, or sample data. Do not create demo/generic patients, and never generate random or estimated amounts, charges, fees, prices, totals, or financial values. All records and every financial value must come from the user's own manual entry. The system may auto-generate only non-financial identifiers (Record IDs, Case numbers). Totals are computed only from real entered values. Seed arrays in `lib/store.js` / `lib/data.js` must stay empty.

- All updates must be backward-compatible with the current persisted store (`localStorage` key in `lib/store.js`).
- **Never bump the store `KEY`** — migrations must preserve 100% of existing data. Add new fields via safe in-place backfill in the relevant getter (see the `getTravel` / `getHospitals` backfill pattern), never by reseeding.
- Preserve existing IDs, relationships, attachments, and history.
- Only delete/modify a record when the user explicitly requests it (and, in UI, via the confirm dialog).
- New features extend the system; they never alter or remove existing information.

## Architecture notes
- Single source of truth is `window.CBStore` (in `lib/store.js`), persisted to localStorage.
- `lib/data.js` holds seed constants; each Babel `.jsx` file declares its own `const { useState } = React;` (isolated scope) and exports via `Object.assign(window, {...})`.
- UI must follow the bound Carebridge design system — style via `var(--*)` tokens.
