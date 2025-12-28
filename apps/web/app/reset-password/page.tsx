'use server';

import { authClient } from '@/src/utils/authClient';
import Link from 'next/link';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <div className='flex flex-col'>
        <h1>Invalid or missing token</h1>
        <Link href='/login'>Go back to Login</Link>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center justify-center h-full w-full'>
      <h1 className='text-3xl mb-4'>Reset Password</h1>
      <form
        action={async (formData: FormData) => {
          'use server';
          const password = formData.get('password') as string;
          const confirmPassword = formData.get('confirmPassword') as string;
          if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
          }
          authClient.resetPassword({ token, newPassword: password });
        }}
        className='flex flex-col gap-4 w-80'
      >
        <input
          type='password'
          name='password'
          placeholder='New Password'
          required
          className='p-2 rounded bg-gray-800 text-white border border-gray-700'
        />
        <input
          type='password'
          name='confirmPassword'
          placeholder='Confirm New Password'
          required
          className='p-2 rounded bg-gray-800 text-white border border-gray-700'
        />
        <button
          type='submit'
          className='bg-blue-600 hover:bg-blue-700 text-white p-2 rounded'
        >
          Reset Password
        </button>
      </form>
    </div>
  );
}
