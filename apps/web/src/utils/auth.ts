import { betterAuth } from 'better-auth';
import { db } from '@/db';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { account, user, session, verification } from '@/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { account, user, session, verification },
  }),
  secret: process.env.BETTER_AUTH_SECRET! || '',
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    },
  },
});
