import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './db/schema.ts',
  out: './db/migrations',
  dbCredentials: {
    url:
      process.env.DATABASE_URL! ||
      `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@postgres:5432/manga_db`,
  },
});
