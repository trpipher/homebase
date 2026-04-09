"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setProvider(initial.provider ?? "")
      setWebsiteUrl(initial.websiteUrl)
      setAccountNum(initial.accountNum ?? "")
      setDueDay(initial.dueDay?.toString() ?? "")
      setNotes(initial.notes ?? "")
    } else {
      setName("")
      setProvider("")
      setWebsiteUrl("")
      setAccountNum("")
      setDueDay("")
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
          <div className="space-y-1.5">
            <Label htmlFor="bf-notes">Notes (optional)</Label>
            <Textarea
              id="bf-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Auto-pay enabled, paperless billing"
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
