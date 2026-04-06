import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const bills = await db.bill.findMany({ orderBy: { name: "asc" } })
  return NextResponse.json(bills)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, provider, websiteUrl, accountNum, dueDay, notes } = body

  if (!name || !websiteUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const bill = await db.bill.create({
    data: {
      name,
      provider: provider || null,
      websiteUrl,
      accountNum: accountNum || null,
      dueDay: dueDay ? Number(dueDay) : null,
      notes: notes || null,
    },
  })

  return NextResponse.json(bill, { status: 201 })
}
