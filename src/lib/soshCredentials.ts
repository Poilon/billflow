import { db, ensureSchema } from "./db";

export interface SoshCredentialsInput {
  login: string;
  password: string;
  contractId: string;
}

export interface SoshCredentialsRecord {
  login: string;
  contractId: string;
  password: string;
}

export async function upsertSoshCredentials({
  login,
  password,
  contractId,
}: SoshCredentialsInput) {
  await ensureSchema();
  await db().query(
    `
      insert into sosh_credentials (id, login, password, contract_id)
      values (1, $1, $2, $3)
      on conflict (id) do update
      set login = excluded.login,
          password = excluded.password,
          contract_id = excluded.contract_id,
          updated_at = now();
    `,
    [login, password, contractId]
  );
}

export async function fetchSoshCredentials(): Promise<SoshCredentialsRecord | null> {
  await ensureSchema();
  const result = await db().query(
    `select login, password, contract_id as "contractId" from sosh_credentials where id = 1`
  );
  if (result.rowCount === 0) return null;
  return result.rows[0];
}
