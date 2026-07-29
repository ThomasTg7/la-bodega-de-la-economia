import { PrismaClient } from "@prisma/client";

const globalParaPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalParaPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalParaPrisma.prisma = db;
}
