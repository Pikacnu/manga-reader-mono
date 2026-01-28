import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import path from 'path';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@postgres:5432/manga_db`,
});

const db = drizzle(pool);

async function main() {
  console.log('--- Starting database migration ---');
  try {
    // 指向 .next/standalone/apps/web/db/migrations 或是容器內的相對路徑
    await migrate(db, {
      migrationsFolder: path.join(__dirname, 'migrations'),
    });
    console.log('--- Migration completed successfully ---');
  } catch (error) {
    console.error('--- Migration failed ---');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
