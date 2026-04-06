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

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function BillCard({ bill, onEdit, onDelete }: BillCardProps) {
  const [expanded, setExpanded] = useState(false)

  const hasDetails = bill.accountNum || bill.notes

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="font-medium text-sm">{bill.name}</span>
              {bill.provider && (
                <span className="text-xs text-muted-foreground">{bill.provider}</span>
              )}
              {bill.dueDay && (
                <Badge variant="outline" className="text-xs">
                  Due {ordinal(bill.dueDay)}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={bill.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                Pay Now
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(bill)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(bill.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {hasDetails && (
          <>
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-foreground transition-colors"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Hide details" : "Show details"}
            </button>
            {expanded && (
              <div className="mt-3 text-xs space-y-1 border-t pt-3">
                {bill.accountNum && (
                  <div>
                    <span className="text-muted-foreground">Account #: </span>
                    <span className="font-mono">{bill.accountNum}</span>
                  </div>
                )}
                {bill.notes && (
                  <div>
                    <span className="text-muted-foreground">Notes: </span>
                    <span>{bill.notes}</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
