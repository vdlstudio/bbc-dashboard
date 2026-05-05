const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Upsert the main team user (idempotent — safe to run on every deploy)
  const hash = await bcrypt.hash("ksgrocks2026!", 12);
  await prisma.user.upsert({
    where: { email: "ksgteam" },
    update: { password: hash, name: "KSG Team", role: "admin" },
    create: {
      name: "KSG Team",
      email: "ksgteam",
      password: hash,
      role: "admin",
    },
  });

  console.log("✅ Seed complete. Login: ksgteam / ksgrocks2026!");
}

main()
  .catch((e) => { console.error("Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
