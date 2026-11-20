import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "./seed-data";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .then(() => console.log("Seeded sample data (6 listings, 20 users)."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
