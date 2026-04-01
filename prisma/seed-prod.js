// Run migrations + seed only if no users exist
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  const adminPwd = process.env.ADMIN_PASSWORD || "admin123";
  const teamPwd = process.env.TEAM_PASSWORD || "team123";

  await prisma.user.create({
    data: {
      name: "Admin",
      email: process.env.ADMIN_EMAIL || "admin@balibusinessclub.com",
      password: await bcrypt.hash(adminPwd, 10),
      role: "admin",
    },
  });

  await prisma.user.create({
    data: {
      name: "Team Member",
      email: process.env.TEAM_EMAIL || "team@balibusinessclub.com",
      password: await bcrypt.hash(teamPwd, 10),
      role: "member",
    },
  });

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => { console.error(e); })
  .finally(async () => { await prisma.$disconnect(); });
