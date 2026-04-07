"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { LinkCard, type LinkItem } from "@/components/links/LinkCard"
import { LinkForm } from "@/components/links/LinkForm"

export default function LinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LinkItem | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  async function load() {
    const res = await fetch("/api/links")
    if (!res.ok) {
      toast.error("Failed to load links")
      return
    }
    const data = await res.json()
    setLinks(data)
  }

  useEffect(() => { load() }, [])

  const categories = [...new Set(links.map((l) => l.category))].sort()

  const filtered = activeCategory
    ? links.filter((l) => l.category === activeCategory)
    : links

  async function handleSave(data: Omit<LinkItem, "id" | "createdAt">) {
    if (editing) {
      await fetch(`/api/links/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      toast.success("Link updated")
    } else {
      await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      toast.success("Link added")
    }
    setEditing(null)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this link?")) return
    await fetch(`/api/links/${id}`, { method: "DELETE" })
    toast.success("Link deleted")
    load()
  }

  function openEdit(link: LinkItem) {
    setEditing(link)
    setFormOpen(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Family Links</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Link
        </Button>
      </div>

      {categories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-sm px-3 py-1 rounded-full transition-colors ${
              activeCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className={`text-sm px-3 py-1 rounded-full transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="mb-4">No links yet.</p>
          <Button
            variant="outline"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add your first link
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <LinkForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
        initial={editing}
        categories={categories}
      />
    </div>
  )
}
