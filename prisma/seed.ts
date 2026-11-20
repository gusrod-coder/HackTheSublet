import { PrismaClient } from "@prisma/client";
import { DRAFTS, LISTINGS, USERS, seedDatabase } from "./seed-data";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .then(() => console.log(`Seeded sample data (${LISTINGS.length + DRAFTS.length} listings, ${USERS.length} users).`))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
