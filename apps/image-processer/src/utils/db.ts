import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DB_URL } from './config';

const pool = new Pool({ connectionString: DB_URL });

export default drizzle(pool);
