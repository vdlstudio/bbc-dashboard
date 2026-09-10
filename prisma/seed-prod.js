const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Upsert the main team user (idempotent — safe to run on every deploy)
  const seedPassword = process.env.SEED_PASSWORD || "ksgrocks2026!";
  const hash = await bcrypt.hash(seedPassword, 12);
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

  console.log("✅ Seed complete. Login: ksgteam / [password from SEED_PASSWORD env]");
}

main()
  .catch((e) => { console.error("Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
