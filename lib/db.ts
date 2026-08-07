import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Set WebSocket constructor for Neon serverless in Node environments
if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL || "";
const adapter = new PrismaNeon({ connectionString });

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
export default db;
