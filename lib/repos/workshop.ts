import { isPostgres } from "../db-config";
import { ensurePostgresMigrated, getPool } from "../db-pg";
import { getSqlite } from "./_sqlite";

export async function workshopRecordClick(opts: {
  userId: number | null;
  productId: string;
  asin: string;
  category: string;
  relevant: boolean;
  sourcePage: string;
}): Promise<void> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    await getPool().query(
      `INSERT INTO workshop_click_events
        (user_id, product_id, asin, category, relevant, source_page)
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        opts.userId,
        opts.productId,
        opts.asin,
        opts.category,
        opts.relevant ? 1 : 0,
        opts.sourcePage,
      ],
    );
    return;
  }
  const db = await getSqlite();
  db.prepare(`
    INSERT INTO workshop_click_events
      (user_id, product_id, asin, category, relevant, source_page)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    opts.userId,
    opts.productId,
    opts.asin,
    opts.category,
    opts.relevant ? 1 : 0,
    opts.sourcePage,
  );
}
