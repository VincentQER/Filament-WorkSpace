import { isPostgres } from "../db-config";
import { ensurePostgresMigrated, getPool } from "../db-pg";
import { getSqlite } from "./_sqlite";

// ── Types ────────────────────────────────────────────────────────────────────

export type AffiliateProductRow = {
  id: number;
  title: string;
  description: string;
  image_url: string;
  amazon_url: string;
  asin: string;
  category: string;
  brand: string;
  material_type: string;
  highlights: string;
  price_range: string;
  is_active: number;   // 0 | 1  (SQLite stores booleans as integers)
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AffiliateProductInput = {
  title: string;
  description: string;
  image_url: string;
  amazon_url: string;
  asin: string;
  category: string;
  brand: string;
  material_type: string;
  highlights: string;
  price_range: string;
  is_active: number;
  sort_order: number;
};

// ── Reads ────────────────────────────────────────────────────────────────────

/** Active products only, sorted by sort_order. Used by the public Workshop page. */
export async function affiliateProductListActive(): Promise<AffiliateProductRow[]> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    const r = await getPool().query<AffiliateProductRow>(
      `SELECT * FROM affiliate_products WHERE is_active = 1 ORDER BY sort_order ASC, id ASC`,
    );
    return r.rows;
  }
  const db = await getSqlite();
  return db
    .prepare(
      `SELECT * FROM affiliate_products WHERE is_active = 1 ORDER BY sort_order ASC, id ASC`,
    )
    .all() as AffiliateProductRow[];
}

/** All products (active and inactive). Used by admin list. */
export async function affiliateProductListAll(): Promise<AffiliateProductRow[]> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    const r = await getPool().query<AffiliateProductRow>(
      `SELECT * FROM affiliate_products ORDER BY sort_order ASC, id ASC`,
    );
    return r.rows;
  }
  const db = await getSqlite();
  return db
    .prepare(`SELECT * FROM affiliate_products ORDER BY sort_order ASC, id ASC`)
    .all() as AffiliateProductRow[];
}

/** Single product by id. Used by admin edit page. */
export async function affiliateProductGetById(
  id: number,
): Promise<AffiliateProductRow | undefined> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    const r = await getPool().query<AffiliateProductRow>(
      `SELECT * FROM affiliate_products WHERE id = $1`,
      [id],
    );
    return r.rows[0];
  }
  const db = await getSqlite();
  return db
    .prepare(`SELECT * FROM affiliate_products WHERE id = ?`)
    .get(id) as AffiliateProductRow | undefined;
}

// ── Writes ───────────────────────────────────────────────────────────────────

/** Create a new affiliate product. Returns the new row's id. */
export async function affiliateProductCreate(data: AffiliateProductInput): Promise<number> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    const r = await getPool().query<{ id: number }>(
      `INSERT INTO affiliate_products
        (title, description, image_url, amazon_url, asin, category, brand,
         material_type, highlights, price_range, is_active, sort_order,
         created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
       RETURNING id`,
      [
        data.title, data.description, data.image_url, data.amazon_url,
        data.asin, data.category, data.brand, data.material_type,
        data.highlights, data.price_range, data.is_active, data.sort_order,
      ],
    );
    return Number(r.rows[0]!.id);
  }
  const db = await getSqlite();
  const result = db
    .prepare(
      `INSERT INTO affiliate_products
        (title, description, image_url, amazon_url, asin, category, brand,
         material_type, highlights, price_range, is_active, sort_order,
         created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    )
    .run(
      data.title, data.description, data.image_url, data.amazon_url,
      data.asin, data.category, data.brand, data.material_type,
      data.highlights, data.price_range, data.is_active, data.sort_order,
    );
  return Number(result.lastInsertRowid);
}

/** Update all fields on an existing product. */
export async function affiliateProductUpdate(
  id: number,
  data: AffiliateProductInput,
): Promise<void> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    await getPool().query(
      `UPDATE affiliate_products
       SET title=$1, description=$2, image_url=$3, amazon_url=$4, asin=$5,
           category=$6, brand=$7, material_type=$8, highlights=$9,
           price_range=$10, is_active=$11, sort_order=$12, updated_at=NOW()
       WHERE id = $13`,
      [
        data.title, data.description, data.image_url, data.amazon_url,
        data.asin, data.category, data.brand, data.material_type,
        data.highlights, data.price_range, data.is_active, data.sort_order,
        id,
      ],
    );
    return;
  }
  const db = await getSqlite();
  db.prepare(
    `UPDATE affiliate_products
     SET title=?, description=?, image_url=?, amazon_url=?, asin=?,
         category=?, brand=?, material_type=?, highlights=?,
         price_range=?, is_active=?, sort_order=?, updated_at=CURRENT_TIMESTAMP
     WHERE id = ?`,
  ).run(
    data.title, data.description, data.image_url, data.amazon_url,
    data.asin, data.category, data.brand, data.material_type,
    data.highlights, data.price_range, data.is_active, data.sort_order,
    id,
  );
}

/** Toggle is_active on a product. */
export async function affiliateProductSetActive(id: number, active: boolean): Promise<void> {
  const val = active ? 1 : 0;
  if (isPostgres()) {
    await ensurePostgresMigrated();
    await getPool().query(
      `UPDATE affiliate_products SET is_active=$1, updated_at=NOW() WHERE id=$2`,
      [val, id],
    );
    return;
  }
  const db = await getSqlite();
  db.prepare(
    `UPDATE affiliate_products SET is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  ).run(val, id);
}

/** Delete a product permanently. */
export async function affiliateProductDelete(id: number): Promise<void> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    await getPool().query(`DELETE FROM affiliate_products WHERE id = $1`, [id]);
    return;
  }
  const db = await getSqlite();
  db.prepare(`DELETE FROM affiliate_products WHERE id = ?`).run(id);
}

/**
 * Swap sort_order with the neighbour in direction "up" (lower sort_order)
 * or "down" (higher sort_order). No-op if already at the boundary.
 */
export async function affiliateProductReorder(
  id: number,
  direction: "up" | "down",
): Promise<void> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    const pool = getPool();

    // Fetch the target row
    const { rows: target } = await pool.query<{ id: number; sort_order: number }>(
      `SELECT id, sort_order FROM affiliate_products WHERE id = $1`,
      [id],
    );
    if (!target[0]) return;

    const op = direction === "up" ? "<" : ">";
    const ord = direction === "up" ? "DESC" : "ASC";

    // Find the closest neighbour in that direction
    const { rows: neighbour } = await pool.query<{ id: number; sort_order: number }>(
      `SELECT id, sort_order FROM affiliate_products
       WHERE sort_order ${op} $1
       ORDER BY sort_order ${ord}
       LIMIT 1`,
      [target[0].sort_order],
    );
    if (!neighbour[0]) return;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE affiliate_products SET sort_order=$1, updated_at=NOW() WHERE id=$2`,
        [neighbour[0].sort_order, id],
      );
      await client.query(
        `UPDATE affiliate_products SET sort_order=$1, updated_at=NOW() WHERE id=$2`,
        [target[0].sort_order, neighbour[0].id],
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    return;
  }

  // SQLite path
  const db = await getSqlite();
  const target = db
    .prepare(`SELECT id, sort_order FROM affiliate_products WHERE id = ?`)
    .get(id) as { id: number; sort_order: number } | undefined;
  if (!target) return;

  const op = direction === "up" ? "<" : ">";
  const ord = direction === "up" ? "DESC" : "ASC";
  const neighbour = db
    .prepare(
      `SELECT id, sort_order FROM affiliate_products
       WHERE sort_order ${op} ?
       ORDER BY sort_order ${ord}
       LIMIT 1`,
    )
    .get(target.sort_order) as { id: number; sort_order: number } | undefined;
  if (!neighbour) return;

  db.transaction(() => {
    db.prepare(
      `UPDATE affiliate_products SET sort_order=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    ).run(neighbour.sort_order, id);
    db.prepare(
      `UPDATE affiliate_products SET sort_order=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    ).run(target.sort_order, neighbour.id);
  })();
}
