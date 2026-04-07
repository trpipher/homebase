"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink, Pencil, Trash2 } from "lucide-react"

export interface LinkItem {
  id: string
  title: string
  url: string
  description?: string | null
  category: string
  createdAt: string
}

interface LinkCardProps {
  link: LinkItem
  onEdit: (link: LinkItem) => void
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

export function LinkCard({ link, onEdit, onDelete }: LinkCardProps) {
  return (
    <Card className="group">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {isSafeUrl(link.url) ? (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-sm hover:text-primary transition-colors flex items-center gap-1"
              >
                {link.title}
                <ExternalLink className="h-3 w-3 opacity-50 shrink-0" />
              </a>
            ) : (
              <span className="font-semibold text-sm flex items-center gap-1">
                {link.title}
              </span>
            )}
            <Badge variant="secondary" className="mt-2">
              {link.category}
            </Badge>
            {link.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {link.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={`Edit ${link.title}`}
              onClick={() => onEdit(link)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              aria-label={`Delete ${link.title}`}
              onClick={() => onDelete(link.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
