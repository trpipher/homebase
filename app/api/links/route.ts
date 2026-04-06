import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const links = await db.link.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(links)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { title, url, description, category } = body

  if (!title || !url || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const link = await db.link.create({
    data: { title, url, description: description || null, category },
  })

  return NextResponse.json(link, { status: 201 })
}
