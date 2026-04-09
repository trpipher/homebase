import { PrismaClient } from "../app/generated/prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

async function main() {
  const password = await bcrypt.hash("family2025", 12)

  await db.user.upsert({
    where: { email: "admin@pipher.dev" },
    update: {},
    create: {
      name: "Family Admin",
      email: "admin@pipher.dev",
      password,
    },
  })

  console.log("Seeded user: admin@pipher.dev / family2025")
  console.log("Change this password after first login!")
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
