import { isPostgres } from "../db-config";
import { ensurePostgresMigrated, getPool } from "../db-pg";
import { getSqlite } from "./_sqlite";

export type UserLoginRow = {
  id: number;
  email: string;
  password_hash: string;
  email_verified: number;
};

export type UserProfileRow = {
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  address: string | null;
  printers_json: string | null;
};

export type VerificationLookupRow = {
  id: number;
  verification_expires_at: string | null;
};

export async function userFindByEmailForLogin(email: string): Promise<UserLoginRow | undefined> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    const r = await getPool().query<UserLoginRow>(
      `SELECT id, email, password_hash, COALESCE(email_verified, 0) AS email_verified
       FROM users WHERE email = $1`,
      [email],
    );
    return r.rows[0];
  }
  const db = await getSqlite();
  return db
    .prepare(
      `SELECT id, email, password_hash, COALESCE(email_verified, 0) AS email_verified FROM users WHERE email = ?`,
    )
    .get(email) as UserLoginRow | undefined;
}

export async function userFindExistingIdByEmail(email: string): Promise<{ id: number } | undefined> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    const r = await getPool().query<{ id: number }>(`SELECT id FROM users WHERE email = $1`, [email]);
    return r.rows[0];
  }
  const db = await getSqlite();
  return db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: number } | undefined;
}

/** New account usable immediately (no email verification). */
export async function userCreateActiveAccount(opts: {
  email: string;
  password_hash: string;
}): Promise<number> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    const r = await getPool().query<{ id: number }>(
      `INSERT INTO users (email, password_hash, email_verified, verification_token, verification_expires_at)
       VALUES ($1, $2, 1, NULL, NULL)
       RETURNING id`,
      [opts.email, opts.password_hash],
    );
    return Number(r.rows[0]!.id);
  }
  const db = await getSqlite();
  const result = db
    .prepare(
      `INSERT INTO users (email, password_hash, email_verified, verification_token, verification_expires_at)
       VALUES (?, ?, 1, NULL, NULL)`,
    )
    .run(opts.email, opts.password_hash);
  return Number(result.lastInsertRowid);
}

export async function userInsertPendingVerification(opts: {
  email: string;
  password_hash: string;
  token: string;
  expires: string;
}): Promise<number> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    const r = await getPool().query<{ id: number }>(
      `INSERT INTO users (email, password_hash, email_verified, verification_token, verification_expires_at)
       VALUES ($1, $2, 0, $3, $4)
       RETURNING id`,
      [opts.email, opts.password_hash, opts.token, opts.expires],
    );
    return Number(r.rows[0]!.id);
  }
  const db = await getSqlite();
  const result = db
    .prepare(
      `INSERT INTO users (email, password_hash, email_verified, verification_token, verification_expires_at)
       VALUES (?, ?, 0, ?, ?)`,
    )
    .run(opts.email, opts.password_hash, opts.token, opts.expires);
  return Number(result.lastInsertRowid);
}

export async function userDeleteById(id: number): Promise<void> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    await getPool().query(`DELETE FROM users WHERE id = $1`, [id]);
    return;
  }
  const db = await getSqlite();
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
}

export async function userFindVerificationPendingByToken(
  token: string,
): Promise<VerificationLookupRow | undefined> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    const r = await getPool().query<VerificationLookupRow>(
      `SELECT id, verification_expires_at FROM users
       WHERE verification_token = $1 AND COALESCE(email_verified, 0) = 0`,
      [token],
    );
    return r.rows[0];
  }
  const db = await getSqlite();
  return db
    .prepare(
      `SELECT id, verification_expires_at FROM users WHERE verification_token = ? AND COALESCE(email_verified, 0) = 0`,
    )
    .get(token) as VerificationLookupRow | undefined;
}

export async function userMarkEmailVerified(id: number): Promise<void> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    await getPool().query(
      `UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires_at = NULL WHERE id = $1`,
      [id],
    );
    return;
  }
  const db = await getSqlite();
  db.prepare(
    `UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires_at = NULL WHERE id = ?`,
  ).run(id);
}

export async function userGetProfileRow(userId: number): Promise<UserProfileRow | undefined> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    const r = await getPool().query<UserProfileRow>(
      `SELECT email, display_name, avatar_url, address, printers_json FROM users WHERE id = $1`,
      [userId],
    );
    return r.rows[0];
  }
  const db = await getSqlite();
  return db
    .prepare(`SELECT email, display_name, avatar_url, address, printers_json FROM users WHERE id = ?`)
    .get(userId) as UserProfileRow | undefined;
}

export async function userUpdateProfileFields(opts: {
  userId: number;
  displayName: string | null;
  avatarUrl: string | null;
  address: string | null;
  printersJson: string;
}): Promise<void> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    await getPool().query(
      `UPDATE users SET display_name = $1, avatar_url = $2, address = $3, printers_json = $4 WHERE id = $5`,
      [opts.displayName, opts.avatarUrl, opts.address, opts.printersJson, opts.userId],
    );
    return;
  }
  const db = await getSqlite();
  db.prepare(
    `UPDATE users SET display_name = ?, avatar_url = ?, address = ?, printers_json = ? WHERE id = ?`,
  ).run(opts.displayName, opts.avatarUrl, opts.address, opts.printersJson, opts.userId);
}

export async function userGetWorkspaceBrandsJson(
  userId: number,
): Promise<{ workspace_brands_json: string | null } | undefined> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    const r = await getPool().query<{ workspace_brands_json: string | null }>(
      `SELECT workspace_brands_json FROM users WHERE id = $1`,
      [userId],
    );
    return r.rows[0];
  }
  const db = await getSqlite();
  return db
    .prepare("SELECT workspace_brands_json FROM users WHERE id = ?")
    .get(userId) as { workspace_brands_json: string | null } | undefined;
}

export async function userFindForResend(email: string): Promise<{
  id: number;
  password_hash: string;
  email_verified: number;
} | undefined> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    const r = await getPool().query<{
      id: number;
      password_hash: string;
      email_verified: number;
    }>(
      `SELECT id, password_hash, COALESCE(email_verified, 0) AS email_verified FROM users WHERE email = $1`,
      [email],
    );
    return r.rows[0];
  }
  const db = await getSqlite();
  return db
    .prepare(
      `SELECT id, password_hash, COALESCE(email_verified, 0) AS email_verified FROM users WHERE email = ?`,
    )
    .get(email) as
    | {
        id: number;
        password_hash: string;
        email_verified: number;
      }
    | undefined;
}

export async function userGetRole(userId: number): Promise<string> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    const r = await getPool().query<{ role: string }>(
      `SELECT COALESCE(role, 'user') AS role FROM users WHERE id = $1`,
      [userId],
    );
    return r.rows[0]?.role ?? "user";
  }
  const db = await getSqlite();
  const row = db
    .prepare(`SELECT COALESCE(role, 'user') AS role FROM users WHERE id = ?`)
    .get(userId) as { role: string } | undefined;
  return row?.role ?? "user";
}

export async function userSetVerificationToken(id: number, token: string, expires: string): Promise<void> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    await getPool().query(
      `UPDATE users SET verification_token = $1, verification_expires_at = $2 WHERE id = $3`,
      [token, expires, id],
    );
    return;
  }
  const db = await getSqlite();
  db.prepare("UPDATE users SET verification_token = ?, verification_expires_at = ? WHERE id = ?").run(
    token,
    expires,
    id,
  );
}
