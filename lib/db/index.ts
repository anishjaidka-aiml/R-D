// lib/db/index.ts
import { Pool, QueryResult, QueryResultRow } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
// Generic query helper
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    // Cast result so callers see typed rows
    return res as QueryResult<T>;
  } finally {
    client.release();
  }
}
