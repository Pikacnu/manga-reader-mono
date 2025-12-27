import { defineConfig } from 'drizzle-kit';
import { DB_URL } from './src/utils/config';

export default defineConfig({
  dialect: 'postgresql',
  schema: './db/schema.ts',
  out: './db/migrations',
  dbCredentials: {
    url: DB_URL,
  },
});
