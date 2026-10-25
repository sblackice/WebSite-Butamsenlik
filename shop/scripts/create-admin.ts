// Creates an admin, or promotes an existing user to admin.
// Usage: npm run admin:create -- email@example.com "Strong-Password-123" "Ad Soyad"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

try {
  process.loadEnvFile(".env");
} catch {}

const [emailArg, password, name = "Yönetici"] = process.argv.slice(2);
const email = (emailArg || "").toLowerCase().trim();
if (!email || !password || password.length < 10) {
  console.error('Usage: npm run admin:create -- email "password (min 10 chars)" "Name"');
  process.exit(1);
}
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }) });
const passwordHash = await bcrypt.hash(password, 12);
const user = await prisma.user.upsert({
  where: { email },
  update: { role: "ADMIN", passwordHash, isActive: true },
  create: { email, name, role: "ADMIN", passwordHash },
});
await prisma.session.deleteMany({ where: { userId: user.id } });
console.log(`Admin ready: ${user.email}`);
await prisma.$disconnect();
