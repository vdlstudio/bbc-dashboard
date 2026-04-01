const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@balibusinessclub.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@balibusinessclub.com",
      password: hash,
      role: "admin",
    },
  });

  // Create a team member
  const hash2 = await bcrypt.hash("team123", 10);
  await prisma.user.upsert({
    where: { email: "team@balibusinessclub.com" },
    update: {},
    create: {
      name: "Team Member",
      email: "team@balibusinessclub.com",
      password: hash2,
      role: "member",
    },
  });

  console.log("Seed complete. Login: admin@balibusinessclub.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
