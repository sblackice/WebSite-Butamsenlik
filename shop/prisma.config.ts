import { defineConfig } from "prisma/config";

// Prisma CLI does not read .env by itself; Node can.
try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: rely on real environment variables.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Fallback lets `npm install` (prisma generate) work before .env exists.
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  },
});
