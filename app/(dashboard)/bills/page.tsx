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
      await fetch(`/api/bills/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      toast.success("Bill updated")
    } else {
      await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      toast.success("Bill added")
    }
    setEditing(null)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this bill?")) return
    await fetch(`/api/bills/${id}`, { method: "DELETE" })
    toast.success("Bill deleted")
    load()
  }

  function openEdit(bill: BillItem) {
    setEditing(bill)
    setFormOpen(true)
  }

  const upcomingBills = bills.filter((b) => b.dueDay != null).sort(
    (a, b) => (a.dueDay ?? 99) - (b.dueDay ?? 99)
  )
  const noDueDateBills = bills.filter((b) => b.dueDay === null)

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
