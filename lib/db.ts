import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Set WebSocket constructor for Neon serverless in Node environments
if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

let connectionString = process.env.DATABASE_URL || "";
if (connectionString.startsWith("ppostgresql://")) {
  connectionString = connectionString.replace("ppostgresql://", "postgresql://");
  process.env.DATABASE_URL = connectionString;
}

const adapter = new PrismaNeon({ connectionString });

export const db = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

export default db;
