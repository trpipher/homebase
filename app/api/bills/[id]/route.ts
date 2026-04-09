import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, provider, websiteUrl, accountNum, dueDay, notes } = body

  const bill = await db.bill.update({
    where: { id },
    data: {
      name,
      provider: provider || null,
      websiteUrl,
      accountNum: accountNum || null,
      dueDay: dueDay ? Number(dueDay) : null,
      notes: notes || null,
    },
  })

  return NextResponse.json(bill)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.bill.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
