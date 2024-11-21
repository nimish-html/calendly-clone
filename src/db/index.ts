import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import * as relations from "./relations";

// Check if the DATABASE_URL environment variable is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create a SQL connection
const sql = neon(process.env.DATABASE_URL);

// Create the database client
export const db = drizzle(sql, { schema: { ...schema, ...relations } });
