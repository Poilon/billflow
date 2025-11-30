import { Pool } from "pg";

let pool: Pool | null = null;

function getPool() {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set (expected a Postgres connection string).");
  }
  pool = new Pool({ connectionString });
  return pool;
}

export async function ensureSchema() {
  const client = await getPool().connect();
  try {
    await client.query(`
      create table if not exists sosh_credentials (
        id integer primary key,
        login text not null,
        password text not null,
        contract_id text not null,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      );
    `);
  } finally {
    client.release();
  }
}

export function db() {
  return getPool();
}
