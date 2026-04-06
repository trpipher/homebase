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

export function LinkCard({ link, onEdit, onDelete }: LinkCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="flex items-start justify-between gap-3 pt-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sm hover:underline flex items-center gap-1"
            >
              {link.title}
              <ExternalLink className="h-3 w-3 opacity-50 shrink-0" />
            </a>
            <Badge variant="secondary" className="text-xs">
              {link.category}
            </Badge>
          </div>
          {link.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {link.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(link)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(link.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
