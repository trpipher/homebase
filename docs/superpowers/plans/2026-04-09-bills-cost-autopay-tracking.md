# Bills: Cost, Autopay & Monthly Tracking — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional monthly cost, a dedicated autopay toggle (card-clickable), and a monthly overview panel to the bills system.

**Architecture:** Schema migration adds `amount Float?` and `autopay Boolean` to `Bill`. API routes are updated to handle partial updates correctly. BillCard gains an `onToggleAutopay` callback for inline toggling. BillForm gains two new fields. The Bills page gains a summary panel computed from the existing bills array. The Home page Finance stat is replaced with live bill data.

**Tech Stack:** Next.js 16 App Router, Prisma 6 + SQLite, TypeScript, Tailwind v4, Base UI (`@base-ui/react` v1.3), Lucide React.

**Testing note:** No automated test suite. Each task ends with a manual browser verification step. Run `npm run dev` from `/mnt/d/Development/PipherDev` before starting and keep it running.

---

## File Map

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `amount Float?` and `autopay Boolean @default(false)` |
| `components/ui/switch.tsx` | **Create** — Base UI Switch component |
| `app/api/bills/route.ts` | Accept `amount`, `autopay` in POST body |
| `app/api/bills/[id]/route.ts` | Fix partial PATCH; accept `amount`, `autopay` |
| `components/bills/BillCard.tsx` | Add amount display, autopay toggle, `onToggleAutopay` prop |
| `components/bills/BillForm.tsx` | Add amount input + autopay Switch field |
| `app/(dashboard)/bills/page.tsx` | Add Monthly Overview panel; wire `onToggleAutopay` |
| `app/(dashboard)/page.tsx` | Replace Finance "Coming Soon" with live bill totals |

---

## Task 1: Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update the Bill model**

In `prisma/schema.prisma`, find the `Bill` model and add the two new fields after `dueDay`:

```prisma
model Bill {
  id         String   @id @default(cuid())
  name       String
  provider   String?
  websiteUrl String
  accountNum String?
  dueDay     Int?
  amount     Float?
  autopay    Boolean  @default(false)
  notes      String?
  createdAt  DateTime @default(now())
}
```

- [ ] **Step 2: Run the migration**

```bash
cd /mnt/d/Development/PipherDev
npx prisma migrate dev --name add-bill-amount-autopay
```

Expected output: `Your database is now in sync with your schema.` and a new folder under `prisma/migrations/`.

- [ ] **Step 3: Regenerate the Prisma client**

```bash
DATABASE_URL="file:./prisma/dev.db" npx prisma generate
```

Expected output: `✔ Generated Prisma Client`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add amount and autopay fields to Bill schema"
```

---

## Task 2: Switch UI Component

**Files:**
- Create: `components/ui/switch.tsx`

This project uses `@base-ui/react` v1.3 for all UI primitives (see `components/ui/dialog.tsx` for the import pattern). No Radix, no `asChild`.

- [ ] **Step 1: Create `components/ui/switch.tsx`**

```tsx
"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        "bg-input data-[checked]:bg-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
          "translate-x-0 data-[checked]:translate-x-4"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:3000 and confirm no build errors in the terminal. The Switch is not yet used anywhere — this step just confirms the file compiles.

- [ ] **Step 3: Commit**

```bash
git add components/ui/switch.tsx
git commit -m "feat: add Switch UI component using Base UI"
```

---

## Task 3: Update API Routes

**Files:**
- Modify: `app/api/bills/route.ts`
- Modify: `app/api/bills/[id]/route.ts`

**Critical:** The current PATCH route destructures all fields and includes them unconditionally in the Prisma update. This means sending `{ autopay: true }` would accidentally null out `provider`, `accountNum`, `dueDay`, and `notes`. This task fixes that and adds the two new fields to both routes.

- [ ] **Step 1: Update `app/api/bills/route.ts`**

Replace the entire file with:

```ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const bills = await db.bill.findMany({ orderBy: { name: "asc" } })
  return NextResponse.json(bills)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, provider, websiteUrl, accountNum, dueDay, amount, autopay, notes } = body

  if (!name || !websiteUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const bill = await db.bill.create({
    data: {
      name,
      provider: provider || null,
      websiteUrl,
      accountNum: accountNum || null,
      dueDay: dueDay ? Number(dueDay) : null,
      amount: amount != null ? Number(amount) : null,
      autopay: autopay === true,
      notes: notes || null,
    },
  })

  return NextResponse.json(bill, { status: 201 })
}
```

- [ ] **Step 2: Update `app/api/bills/[id]/route.ts`**

Replace the entire file with:

```ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Build update object only from fields present in the body.
  // This allows partial updates (e.g. toggling autopay from the card
  // without sending the full bill payload).
  const data: Record<string, unknown> = {}
  if ("name" in body) data.name = body.name
  if ("provider" in body) data.provider = body.provider || null
  if ("websiteUrl" in body) data.websiteUrl = body.websiteUrl
  if ("accountNum" in body) data.accountNum = body.accountNum || null
  if ("dueDay" in body) data.dueDay = body.dueDay ? Number(body.dueDay) : null
  if ("amount" in body) data.amount = body.amount != null ? Number(body.amount) : null
  if ("autopay" in body) data.autopay = body.autopay === true
  if ("notes" in body) data.notes = body.notes || null

  const bill = await db.bill.update({ where: { id }, data })
  return NextResponse.json(bill)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.bill.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Verify in browser**

Open http://localhost:3000/bills — confirm it loads without errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/bills/route.ts app/api/bills/\[id\]/route.ts
git commit -m "feat: add amount and autopay to bills API, fix partial PATCH"
```

---

## Task 4: Update BillCard

**Files:**
- Modify: `components/bills/BillCard.tsx`

The card gets: amount displayed below provider, an autopay pill in the footer (clickable, calls `onToggleAutopay`), and notes toggle retained. The `BillItem` interface gains `amount` and `autopay`.

- [ ] **Step 1: Replace `components/bills/BillCard.tsx`**

```tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Pencil, Trash2, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"

export interface BillItem {
  id: string
  name: string
  provider?: string | null
  websiteUrl: string
  accountNum?: string | null
  dueDay?: number | null
  amount?: number | null
  autopay: boolean
  notes?: string | null
  createdAt: string
}

interface BillCardProps {
  bill: BillItem
  onEdit: (bill: BillItem) => void
  onDelete: (id: string) => void
  onToggleAutopay: (id: string, autopay: boolean) => Promise<void>
}

function isSafeUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
  } catch {
    return false
  }
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function BillCard({ bill, onEdit, onDelete, onToggleAutopay }: BillCardProps) {
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [autopay, setAutopay] = useState(bill.autopay)
  const [togglingAutopay, setTogglingAutopay] = useState(false)

  async function handleAutopayClick() {
    const next = !autopay
    setAutopay(next) // optimistic
    setTogglingAutopay(true)
    try {
      await onToggleAutopay(bill.id, next)
    } catch {
      setAutopay(!next) // revert on error
    } finally {
      setTogglingAutopay(false)
    }
  }

  return (
    <Card className="group">
      <CardContent className="pt-4">
        {/* Name + due badge */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="font-semibold text-sm">{bill.name}</span>
          {bill.dueDay && (
            <Badge variant="secondary" className="shrink-0">
              Due {ordinal(bill.dueDay)}
            </Badge>
          )}
        </div>

        {/* Provider */}
        {bill.provider && (
          <p className="text-xs text-muted-foreground mb-2">{bill.provider}</p>
        )}

        {/* Amount */}
        {bill.amount != null ? (
          <p className="text-lg font-bold text-primary mb-1">
            ${bill.amount.toFixed(2)}
            <span className="text-xs font-normal text-muted-foreground"> /mo</span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/50 mb-1">No amount set</p>
        )}

        {/* Divider + footer */}
        <div className="border-t border-border pt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {bill.accountNum && (
              <span className="text-xs text-muted-foreground font-mono truncate">
                ···{bill.accountNum.slice(-4)}
              </span>
            )}

            {/* Autopay toggle */}
            <button
              onClick={handleAutopayClick}
              disabled={togglingAutopay}
              aria-label={autopay ? "Autopay on — click to disable" : "Autopay off — click to enable"}
              className={
                autopay
                  ? "flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 transition-colors bg-[oklch(0.9_0.05_155)] text-[oklch(0.38_0.09_155)] hover:bg-[oklch(0.85_0.07_155)]"
                  : "flex items-center gap-1 text-xs rounded-full px-2 py-0.5 transition-colors border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
              }
            >
              <RefreshCw className="h-3 w-3" />
              Auto
            </button>

            {/* Notes toggle */}
            {bill.notes && (
              <button
                className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
                aria-label={notesExpanded ? "Collapse notes" : "Expand notes"}
                onClick={() => setNotesExpanded((v) => !v)}
              >
                {notesExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                Notes
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isSafeUrl(bill.websiteUrl) && (
              <a href={bill.websiteUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="h-7 text-xs gap-1">
                  Pay Now
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={`Edit ${bill.name}`}
                onClick={() => onEdit(bill)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                aria-label={`Delete ${bill.name}`}
                onClick={() => onDelete(bill.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Notes expand */}
        {notesExpanded && bill.notes && (
          <div className="mt-3 text-xs text-muted-foreground border-t border-border pt-3">
            {bill.notes}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:3000/bills. The page will have a TypeScript error because `BillsPage` doesn't yet pass `onToggleAutopay` — that's expected and will be fixed in Task 6. For now just confirm there are no import errors in the terminal.

- [ ] **Step 3: Commit**

```bash
git add components/bills/BillCard.tsx
git commit -m "feat: update BillCard with amount display and autopay toggle"
```

---

## Task 5: Update BillForm

**Files:**
- Modify: `components/bills/BillForm.tsx`

Add `amount` (number input) and `autopay` (Switch toggle). The Switch sits in a 2-col grid row alongside the Due Day field.

- [ ] **Step 1: Replace `components/bills/BillForm.tsx`**

```tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { BillItem } from "./BillCard"

type BillFormData = Omit<BillItem, "id" | "createdAt">

interface BillFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: BillFormData) => Promise<void>
  initial?: BillItem | null
}

export function BillForm({ open, onClose, onSave, initial }: BillFormProps) {
  const [name, setName] = useState("")
  const [provider, setProvider] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [accountNum, setAccountNum] = useState("")
  const [dueDay, setDueDay] = useState("")
  const [amount, setAmount] = useState("")
  const [autopay, setAutopay] = useState(false)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setProvider(initial.provider ?? "")
      setWebsiteUrl(initial.websiteUrl)
      setAccountNum(initial.accountNum ?? "")
      setDueDay(initial.dueDay?.toString() ?? "")
      setAmount(initial.amount != null ? initial.amount.toString() : "")
      setAutopay(initial.autopay)
      setNotes(initial.notes ?? "")
    } else {
      setName("")
      setProvider("")
      setWebsiteUrl("")
      setAccountNum("")
      setDueDay("")
      setAmount("")
      setAutopay(false)
      setNotes("")
    }
  }, [initial, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({
      name,
      provider: provider || null,
      websiteUrl,
      accountNum: accountNum || null,
      dueDay: dueDay ? Number(dueDay) : null,
      amount: amount !== "" ? Number(amount) : null,
      autopay,
      notes: notes || null,
    })
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Bill" : "Add Bill"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="bf-name">Bill Name</Label>
            <Input
              id="bf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Electricity"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bf-provider">Provider (optional)</Label>
            <Input
              id="bf-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="Xcel Energy"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bf-url">Payment Website</Label>
            <Input
              id="bf-url"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://myaccount.xcelenergy.com"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bf-account">Account # (optional)</Label>
              <Input
                id="bf-account"
                value={accountNum}
                onChange={(e) => setAccountNum(e.target.value)}
                placeholder="123456789"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-due">Due Day of Month</Label>
              <Input
                id="bf-due"
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="15"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bf-amount">Monthly Cost (optional)</Label>
              <Input
                id="bf-amount"
                type="number"
                min={0}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="29.99"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-autopay">Autopay</Label>
              <div className="flex items-center h-9 gap-2">
                <Switch
                  id="bf-autopay"
                  checked={autopay}
                  onCheckedChange={setAutopay}
                />
                <span className="text-sm text-muted-foreground">
                  {autopay ? "On" : "Off"}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bf-notes">Notes (optional)</Label>
            <Textarea
              id="bf-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Login instructions, paperless billing, etc."
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : initial ? "Update" : "Add Bill"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:3000/bills and click "Add Bill". The form should show all fields including Monthly Cost and the Autopay toggle. Confirm the Switch renders and toggles.

- [ ] **Step 3: Commit**

```bash
git add components/bills/BillForm.tsx
git commit -m "feat: add amount and autopay fields to BillForm"
```

---

## Task 6: Bills Page — Monthly Overview + Autopay Wiring

**Files:**
- Modify: `app/(dashboard)/bills/page.tsx`

Wire `onToggleAutopay` to BillCard and add the Monthly Overview panel above the card grids.

- [ ] **Step 1: Replace `app/(dashboard)/bills/page.tsx`**

```tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { BillCard, type BillItem } from "@/components/bills/BillCard"
import { BillForm } from "@/components/bills/BillForm"

export default function BillsPage() {
  const [bills, setBills] = useState<BillItem[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BillItem | null>(null)

  async function load() {
    const res = await fetch("/api/bills")
    if (!res.ok) {
      toast.error("Failed to load bills")
      return
    }
    const data = await res.json()
    setBills(data)
  }

  useEffect(() => { load() }, [])

  async function handleSave(data: Omit<BillItem, "id" | "createdAt">) {
    if (editing) {
      const res = await fetch(`/api/bills/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) { toast.error("Failed to save bill"); return }
      toast.success("Bill updated")
    } else {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) { toast.error("Failed to save bill"); return }
      toast.success("Bill added")
    }
    setEditing(null)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this bill?")) return
    const res = await fetch(`/api/bills/${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error("Failed to delete bill"); return }
    toast.success("Bill deleted")
    load()
  }

  async function handleToggleAutopay(id: string, autopay: boolean) {
    const res = await fetch(`/api/bills/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autopay }),
    })
    if (!res.ok) {
      toast.error("Failed to update autopay")
      throw new Error("PATCH failed") // causes BillCard to revert optimistic state
    }
  }

  function openEdit(bill: BillItem) {
    setEditing(bill)
    setFormOpen(true)
  }

  const upcomingBills = bills
    .filter((b) => b.dueDay != null)
    .sort((a, b) => (a.dueDay ?? 99) - (b.dueDay ?? 99))
  const noDueDateBills = bills.filter((b) => b.dueDay === null)

  // Monthly overview calculations
  const billsWithAmount = bills.filter((b) => b.amount != null)
  const totalMonthly = billsWithAmount.reduce((sum, b) => sum + (b.amount ?? 0), 0)
  const autopayCount = bills.filter((b) => b.autopay).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Bills</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Bill
        </Button>
      </div>

      {bills.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="mb-4">No bills yet.</p>
          <Button
            variant="outline"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add your first bill
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Monthly overview */}
          <div className="rounded-2xl border border-border bg-card px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Monthly Overview
            </p>
            <div className="flex items-end gap-6">
              <div>
                {billsWithAmount.length > 0 ? (
                  <>
                    <div className="font-heading text-3xl font-bold text-primary">
                      ${totalMonthly.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">per month</div>
                  </>
                ) : (
                  <>
                    <div className="font-heading text-3xl font-bold text-muted-foreground/40">$—</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Add amounts to bills to track monthly spend
                    </div>
                  </>
                )}
              </div>
              <div className="w-px self-stretch bg-border" />
              <div>
                <div className="text-lg font-semibold">{bills.length}</div>
                <div className="text-xs text-muted-foreground">bills tracked</div>
              </div>
              <div className="w-px self-stretch bg-border" />
              <div>
                <div className="text-lg font-semibold">{autopayCount} of {bills.length}</div>
                <div className="text-xs text-muted-foreground">on autopay</div>
              </div>
            </div>
          </div>

          {upcomingBills.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                By Due Date
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingBills.map((bill) => (
                  <BillCard
                    key={bill.id}
                    bill={bill}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onToggleAutopay={handleToggleAutopay}
                  />
                ))}
              </div>
            </section>
          )}

          {noDueDateBills.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Other Bills
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {noDueDateBills.map((bill) => (
                  <BillCard
                    key={bill.id}
                    bill={bill}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onToggleAutopay={handleToggleAutopay}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <BillForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
        initial={editing}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:3000/bills. Confirm:
- Monthly Overview panel appears above the bill grids
- Cards render with amount and autopay toggle
- Clicking the autopay pill on a card toggles it (green filled ↔ dashed grey) without opening a form
- Adding/editing a bill via the form includes Monthly Cost and Autopay fields

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/bills/page.tsx
git commit -m "feat: add monthly overview panel and wire autopay toggle on bills page"
```

---

## Task 7: Home Page — Finance Stat Card

**Files:**
- Modify: `app/(dashboard)/page.tsx`

Replace the "Coming Soon" Finance card with live bill totals computed from the already-fetched `bills` array.

- [ ] **Step 1: Update `app/(dashboard)/page.tsx`**

Find the Finance card block (the `<Card className="bg-secondary border-secondary shadow-none">` card) and the section just before it where `upcomingBills` is derived. Make these changes:

**Add these two computed values** after the `upcomingBills` declaration (around line 24):

```tsx
  const billsWithAmount = bills.filter((b) => b.amount != null)
  const totalMonthly = billsWithAmount.reduce((sum, b) => sum + (b.amount ?? 0), 0)
  const autopayCount = bills.filter((b) => b.autopay).length
```

**Replace the Finance card** (`<Card className="bg-secondary border-secondary shadow-none">` block) with:

```tsx
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Monthly Bills
            </p>
            {billsWithAmount.length > 0 ? (
              <div className="font-heading text-4xl font-bold text-primary">
                ${Math.round(totalMonthly)}
              </div>
            ) : (
              <div className="font-heading text-4xl font-bold text-muted-foreground/40">
                $—
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {bills.length} {bills.length === 1 ? "bill" : "bills"} · {autopayCount} autopay
            </p>
            <Link
              href="/bills"
              className="text-xs text-primary hover:underline mt-3 inline-block"
            >
              View all →
            </Link>
          </CardContent>
        </Card>
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:3000. Confirm:
- The Finance card now shows the monthly total (or `$—` if no amounts are set on any bills)
- The subtext shows bill count and autopay count
- The "View all →" link navigates to `/bills`

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/page.tsx
git commit -m "feat: replace Finance Coming Soon card with live monthly bill totals"
```

---

## Done

All tasks complete. The bills system now tracks monthly costs, shows an autopay status that can be toggled directly from the card, and surfaces totals on both the Bills page and the Home page.

Run `superpowers:finishing-a-development-branch` when ready to create a PR.
