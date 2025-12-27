import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@postgres:5432/manga_db`,
});

const db = drizzle(pool);

export { db };
