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
import type { LinkItem } from "./LinkCard"

interface LinkFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<LinkItem, "id" | "createdAt">) => Promise<void>
  initial?: LinkItem | null
  categories: string[]
}

export function LinkForm({ open, onClose, onSave, initial, categories }: LinkFormProps) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) {
      setTitle(initial.title)
      setUrl(initial.url)
      setDescription(initial.description ?? "")
      setCategory(initial.category)
      setNewCategory("")
    } else {
      setTitle("")
      setUrl("")
      setDescription("")
      setCategory(categories[0] ?? "")
      setNewCategory("")
    }
  }, [initial, open, categories])

  const effectiveCategory = newCategory.trim() || category

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!effectiveCategory) return
    setSaving(true)
    await onSave({ title, url, description, category: effectiveCategory })
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Link" : "Add Link"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="lf-title">Title</Label>
            <Input
              id="lf-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Google Drive"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lf-url">URL</Label>
            <Input
              id="lf-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lf-desc">Description (optional)</Label>
            <Textarea
              id="lf-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Family photos and documents"
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lf-category">Category</Label>
            {categories.length > 0 && (
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mb-2"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
            <Input
              id="lf-category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder={categories.length > 0 ? "Or type a new category…" : "Category (e.g. School, Health)"}
              required={categories.length === 0}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : initial ? "Update" : "Add Link"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
