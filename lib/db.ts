import { PrismaClient } from "@/app/generated/prisma/client"
import path from "path"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Resolve to an absolute path so the database can always be found
// regardless of which directory Next.js workers use as CWD.
const dbUrl = process.env.DATABASE_URL?.startsWith("file:./")
  ? `file:${path.resolve(process.cwd(), process.env.DATABASE_URL.slice(7))}`
  : (process.env.DATABASE_URL ?? `file:${path.resolve(process.cwd(), "dev.db")}`)

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ datasourceUrl: dbUrl })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
