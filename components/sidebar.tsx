"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Home, Link2, Receipt, TrendingUp } from "lucide-react"

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/links", label: "Links", icon: Link2 },
  { href: "/bills", label: "Bills", icon: Receipt },
]

export function Sidebar({ userName }: { userName?: string | null }) {
  const pathname = usePathname()
  const initial = (userName ?? "F")[0].toUpperCase()

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col bg-card border-r border-border">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-border">
        <div className="font-heading text-lg font-bold text-foreground">Pipher.Dev</div>
        <div className="text-xs text-muted-foreground mt-0.5">Family Homebase</div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === href
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        {/* Finance — coming soon, non-navigable */}
        <span className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground/50 cursor-default select-none">
          <TrendingUp className="h-4 w-4 shrink-0" />
          Finance
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
            Soon
          </span>
        </span>
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold shrink-0">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground truncate">{userName ?? "Family"}</div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
