# Bills: Cost, Autopay, and Monthly Tracking

**Date:** 2026-04-09
**Status:** Approved

## Overview

Add three interconnected features to the bills system:

1. **Monthly cost field** — optional `amount` on each bill, displayed prominently on the card
2. **Autopay toggle** — dedicated boolean replacing the freeform notes-as-autopay pattern; togglable directly from the card without opening the edit form
3. **Monthly tracking** — aggregate view on both the Bills page and the Home page Finance stat

Notes field is retained alongside autopay.

---

## Schema Changes

Add two fields to the `Bill` model in `prisma/schema.prisma`:

```prisma
model Bill {
  id         String   @id @default(cuid())
  name       String
  provider   String?
  websiteUrl String
  accountNum String?
  dueDay     Int?
  amount     Float?       // NEW — monthly cost, optional
  autopay    Boolean  @default(false)  // NEW
  notes      String?
  createdAt  DateTime @default(now())
}
```

Migration: `prisma migrate dev --name add-bill-amount-autopay`

---

## BillCard

### Layout (Option A — approved)

```
┌─────────────────────────────────────────┐
│ Bill Name                    Due Xth    │
│ Provider                                │
│ $XX.XX /mo          ← large, sage green │
│ ─────────────────────────────────────── │
│ ···4821  [⟳ Auto]           [Pay Now ↗] │
└─────────────────────────────────────────┘
```

- **Amount:** Displayed below the provider as `$XX.XX /mo` (18px bold, sage green). If no amount is set, show `No amount set` in muted grey.
- **Autopay badge:** Sits in the footer left, next to the account number.
  - **On:** Sage green filled pill — `⟳ Auto` — `bg: oklch(0.9 0.05 155)`, `color: oklch(0.38 0.09 155)`
  - **Off:** Dashed grey pill — `⟳ Auto` — `border: 1px dashed #ddd`, `color: #bbb`
  - Clicking either state sends a `PATCH` to toggle `autopay` immediately (optimistic UI update, revert on error)
- **Notes toggle:** Remains — `▾ Notes` button only shown if `notes` is non-null, expands inline as before

### BillItem interface additions

```ts
amount?: number | null
autopay: boolean
```

---

## BillForm

Add two new fields to the Add/Edit dialog:

### Amount field
- Label: `Monthly Cost (optional)`
- Input: `type="number"`, `min=0`, `step=0.01`, placeholder `29.99`
- Stored as `Float | null` — empty input = null

### Autopay field
- Label: `Autopay`
- Use shadcn `Switch` component (already available via Base UI)
- Default: off
- Position: same row as Due Day (2-col grid: Due Day | Autopay toggle)

Form submits `amount` (number or null) and `autopay` (boolean) alongside existing fields.

---

## API Changes

### `POST /api/bills` and `PATCH /api/bills/[id]`

Accept and persist `amount` and `autopay` in both routes. The PATCH route already does partial updates — add the two new fields to the destructured body and Prisma update call.

No new endpoint needed for the autopay card toggle — the existing `PATCH /api/bills/[id]` accepts partial payloads (send only `{ autopay: boolean }` from the card).

---

## Bills Page — Monthly Overview

A summary panel sits between the page heading and the "By Due Date" section:

```
┌─────────────────────────────────────────────────────┐
│  MONTHLY OVERVIEW                                   │
│  $284.47         │  8          │  5 of 8            │
│  per month       │  bills      │  on autopay        │
└─────────────────────────────────────────────────────┘
```

- Only rendered when `bills.length > 0`
- `totalMonthly` = sum of `amount` for bills where `amount != null` (bills with no amount are excluded from sum, not counted as $0)
- If no bills have amounts set yet, show `$—` for total with a note: `Add amounts to bills to track monthly spend`
- `autopayCount` = count of bills where `autopay === true`

---

## Home Page — Finance Stat Card

Replace the current `bg-secondary` Finance "Coming Soon" card with a real stat pulled from the existing server-side `db.bill.findMany()` call (bills are already fetched on this page).

```
┌──────────────────────────┐
│  Monthly Bills           │
│  $284                    │  ← rounded, no cents
│  8 bills · 5 autopay     │
└──────────────────────────┘
```

- Compute `totalMonthly` and `autopayCount` server-side in `app/(dashboard)/page.tsx`
- Display rounded total (`Math.round`) — the home page is a glance view, not an accounting tool
- If no bills have amounts: show `$—`
- Remove the "Soon" badge from the Finance card

---

## What Stays the Same

- Notes field: kept, togglable as before
- `isSafeUrl` guard on Pay Now link
- `aria-label` on edit/delete icon buttons
- Card hover-reveal for edit/delete
- Bills page grid layout (3-col) and section structure (By Due Date / Other Bills)
