import { betterAuth } from 'better-auth';
import { db } from '@/db';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { account, user, session, verification } from '@/db/schema';
import { EmailType, sendEmail } from './sendEmail';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { account, user, session, verification },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sendResetPassword: async ({ user, url, token }, request) => {
      void sendEmail(user.email, url, EmailType.RESET_PASSWORD);
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onPasswordReset: async ({ user }, request) => {
      console.log('Password reset for user:', user.email);
    },
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sendVerificationEmail: async ({ user, url, token }, request) => {
      void sendEmail(user.email, url, EmailType.SIGNUP);
    },
    sendOnSignIn: true,
    sendOnSignUp: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    afterEmailVerification: async (user, request) => {
      console.log('Email verified for user:', user.email);
    },
    autoSignInAfterVerification: true,
    expiresIn: 30 * 60, // 30 minutes
  },
  secret: process.env.BETTER_AUTH_SECRET! || '',
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    },
  },
});
