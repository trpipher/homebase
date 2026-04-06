import { auth } from "@/auth"
import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Link2, Receipt, TrendingUp } from "lucide-react"

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
    .sort((a, b) => {
      const daysA = ((a.dueDay! - today + 31) % 31)
      const daysB = ((b.dueDay! - today + 31) % 31)
      return daysA - daysB
    })
    .slice(0, 4)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back, {session?.user?.name?.split(" ")[0] ?? "Family"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Your family homebase</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{links.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {linkCategories.length} {linkCategories.length === 1 ? "category" : "categories"}
            </p>
            <Link
              href="/links"
              className="text-xs text-primary hover:underline mt-3 inline-block"
            >
              View all links →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{bills.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {bills.filter((b) => b.dueDay !== null).length} with due dates
            </p>
            <Link
              href="/bills"
              className="text-xs text-primary hover:underline mt-3 inline-block"
            >
              View all bills →
            </Link>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Finance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Banking dashboard coming soon.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Will connect via Plaid to show account balances and transactions.
            </p>
          </CardContent>
        </Card>
      </div>

      {upcomingBills.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Upcoming Bills</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingBills.map((bill) => (
              <Card key={bill.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="font-medium text-sm">{bill.name}</div>
                  {bill.provider && (
                    <div className="text-xs text-muted-foreground mt-0.5">{bill.provider}</div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline" className="text-xs">
                      {ordinal(bill.dueDay!)}
                    </Badge>
                    <a
                      href={bill.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-0.5"
                    >
                      Pay <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {links.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Links</h2>
            <Link href="/links" className="text-sm text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 rounded-lg border hover:shadow-sm hover:border-foreground/20 transition-all group"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{link.title}</div>
                  <div className="text-xs text-muted-foreground">{link.category}</div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
