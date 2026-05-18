import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  const pool = new Pool({ connectionString: url });
  return { pool, db: drizzle(pool, { schema }) };
}

const _instance = createDb();

export const pool = _instance.pool;
export const db = _instance.db;

export * from "./schema";
