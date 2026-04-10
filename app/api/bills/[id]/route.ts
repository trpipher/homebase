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

  // Build update object only from fields present in the body.
  // This allows partial updates (e.g. toggling autopay from the card
  // without sending the full bill payload).
  const data: Record<string, unknown> = {}
  if ("name" in body) data.name = body.name
  if ("provider" in body) data.provider = body.provider || null
  if ("websiteUrl" in body) data.websiteUrl = body.websiteUrl
  if ("accountNum" in body) data.accountNum = body.accountNum || null
  if ("dueDay" in body) data.dueDay = body.dueDay ? Number(body.dueDay) : null
  if ("amount" in body) data.amount = body.amount != null ? Number(body.amount) : null
  if ("autopay" in body) data.autopay = body.autopay === true
  if ("notes" in body) data.notes = body.notes || null

  const bill = await db.bill.update({ where: { id }, data })
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
