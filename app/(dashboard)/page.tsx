import { auth } from "@/auth"
import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default async function HomePage() {
  const session = await auth()
  const [links, bills] = await Promise.all([
    db.link.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    db.bill.findMany({ orderBy: { name: "asc" } }),
  ])

  const linkCategories = [...new Set(links.map((l) => l.category))]
  const today = new Date().getDate()
  const upcomingBills = bills
    .filter((b) => b.dueDay !== null)
    .sort((a, b) => ((a.dueDay! - today + 31) % 31) - ((b.dueDay! - today + 31) % 31))
    .slice(0, 4)

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">
          Welcome back, {session?.user?.name?.split(" ")[0] ?? "Family"} 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{dateStr}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Links</p>
            <div className="font-heading text-4xl font-bold">{links.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {linkCategories.length}{" "}
              {linkCategories.length === 1 ? "category" : "categories"}
            </p>
            <Link
              href="/links"
              className="text-xs text-primary hover:underline mt-3 inline-block"
            >
              View all →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Bills</p>
            <div className="font-heading text-4xl font-bold">{bills.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {bills.filter((b) => b.dueDay !== null).length} with due dates
            </p>
            <Link
              href="/bills"
              className="text-xs text-primary hover:underline mt-3 inline-block"
            >
              View all →
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-secondary border-secondary shadow-none">
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-widest text-secondary-foreground/70 mb-2">
              Finance
            </p>
            <div className="font-heading text-xl font-bold text-secondary-foreground mt-2">
              Coming Soon
            </div>
            <p className="text-xs text-secondary-foreground/70 mt-1">Plaid integration</p>
          </CardContent>
        </Card>
      </div>

      {upcomingBills.length > 0 && (
        <div className="mb-8">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold">Upcoming Bills</h2>
            <Link href="/bills" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {upcomingBills.map((bill) => (
              <Card key={bill.id}>
                <CardContent className="pt-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm">{bill.name}</div>
                    {bill.provider && (
                      <div className="text-xs text-muted-foreground mt-0.5">{bill.provider}</div>
                    )}
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {ordinal(bill.dueDay!)}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {links.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold">Recent Links</h2>
            <Link href="/links" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {links.map((link) => (
              <Card key={link.id}>
                <CardContent className="pt-4">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sm hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {link.title}
                    <ExternalLink className="h-3 w-3 opacity-50 shrink-0" />
                  </a>
                  <Badge variant="secondary" className="mt-2">
                    {link.category}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
