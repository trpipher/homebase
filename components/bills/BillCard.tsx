"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react"

export interface BillItem {
  id: string
  name: string
  provider?: string | null
  websiteUrl: string
  accountNum?: string | null
  dueDay?: number | null
  notes?: string | null
  createdAt: string
}

interface BillCardProps {
  bill: BillItem
  onEdit: (bill: BillItem) => void
  onDelete: (id: string) => void
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

export function BillCard({ bill, onEdit, onDelete }: BillCardProps) {
  const [notesExpanded, setNotesExpanded] = useState(false)

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
          <p className="text-xs text-muted-foreground mb-3">{bill.provider}</p>
        )}

        {/* Divider + account + actions */}
        <div className="border-t border-border pt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {bill.accountNum && (
              <span className="text-xs text-muted-foreground font-mono truncate">
                ···{bill.accountNum.slice(-4)}
              </span>
            )}
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
